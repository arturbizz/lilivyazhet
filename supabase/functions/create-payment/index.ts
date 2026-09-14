// =====================================================================
//  Edge Function «create-payment» — оплата заказа через ЮKassa
// ---------------------------------------------------------------------
//  Сайт вызывает её после оформления заказа:
//    { payment_id, action: "create" } → ссылка на страницу оплаты ЮKassa
//    { payment_id, action: "check" }  → актуальный статус оплаты
//
//  Секреты (Supabase → Edge Functions → Secrets):
//    YOOKASSA_SHOP_ID       shopId магазина в ЮKassa
//    YOOKASSA_SECRET_KEY    секретный ключ (у тестового магазина начинается с test_)
//    SITE_URL               адрес сайта без «/» в конце,
//                           например https://ВАШ-ЛОГИН.github.io/lilivyazhet
//  Необязательные:
//    YOOKASSA_SEND_RECEIPT  "true" — передавать данные для чека (если в ЮKassa
//                           подключены «Чеки от ЮKassa»; иначе не ставьте)
//    YOOKASSA_VAT_CODE      код НДС для чека, по умолчанию 1 (без НДС)
//    YOOKASSA_PAYMENT_MODE  признак расчёта, по умолчанию full_prepayment
//
//  Настройка «Enforce JWT verification» для этой функции — ВКЛЮЧЕНА.
// =====================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const YK_API = 'https://api.yookassa.ru/v3';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

const env = (key: string) => Deno.env.get(key) ?? '';

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function ykGet(id: string, auth: string) {
  const res = await fetch(`${YK_API}/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: auth },
  });
  if (!res.ok) return null;
  return await res.json();
}

// Переносит статус платежа из ЮKassa в нашу базу
// deno-lint-ignore no-explicit-any
async function syncPayment(admin: any, pay: any, yk: any) {
  if (yk?.status === 'succeeded') {
    const paid = Number(yk.amount?.value);
    const expected = Number(pay.amount);
    if (!Number.isFinite(paid) || Math.abs(paid - expected) > 0.009 || yk.amount?.currency !== 'RUB') {
      console.error('Сумма оплаты не совпадает с заказом', { paid, expected, payment: pay.id });
      return;
    }
    const { error } = await admin.rpc('mark_payment_succeeded', {
      p_payment_id: pay.id,
      p_provider_payment_id: yk.id,
    });
    if (error) console.error('mark_payment_succeeded', error);
  } else if (yk?.status === 'canceled') {
    const { error } = await admin.rpc('mark_payment_canceled', { p_payment_id: pay.id });
    if (error) console.error('mark_payment_canceled', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const shopId = env('YOOKASSA_SHOP_ID');
  const secretKey = env('YOOKASSA_SECRET_KEY');
  const siteUrl = env('SITE_URL').replace(/\/+$/, '');
  if (!shopId || !secretKey || !siteUrl) {
    return json({ error: 'Онлайн-оплата ещё не подключена. Заказ сохранён — мы свяжемся с вами.' }, 503);
  }
  const ykAuth = 'Basic ' + btoa(`${shopId}:${secretKey}`);

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- кто вызывает ---
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json({ error: 'Войдите в аккаунт' }, 401);

  // deno-lint-ignore no-explicit-any
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Некорректный запрос' }, 400);
  }
  const paymentId = String(body?.payment_id ?? '');
  const action = body?.action === 'check' ? 'check' : 'create';
  if (!/^[0-9a-f-]{36}$/i.test(paymentId)) return json({ error: 'Некорректный номер оплаты' }, 400);

  const { data: pay } = await admin.from('payments').select('*').eq('id', paymentId).maybeSingle();
  if (!pay || pay.customer_id !== user.id) return json({ error: 'Покупка не найдена' }, 404);

  // --- проверка статуса ---
  if (action === 'check') {
    if (pay.status === 'pending' && pay.provider_payment_id) {
      const yk = await ykGet(pay.provider_payment_id, ykAuth);
      if (yk) await syncPayment(admin, pay, yk);
    }
    const { data: fresh } = await admin.from('payments').select('status').eq('id', pay.id).single();
    return json({ status: fresh?.status ?? pay.status });
  }

  // --- создание платежа ---
  if (pay.status !== 'pending') {
    return json({
      status: pay.status,
      error: pay.status === 'succeeded' ? 'Эта покупка уже оплачена' : 'Эта покупка отменена',
    }, 409);
  }

  // Платёж уже создавали? Если он ещё ждёт оплаты — отдаём ту же ссылку.
  if (pay.provider_payment_id) {
    const yk = await ykGet(pay.provider_payment_id, ykAuth);
    if (yk?.status === 'pending' && yk.confirmation?.confirmation_url) {
      return json({ confirmation_url: yk.confirmation.confirmation_url });
    }
    if (yk && (yk.status === 'succeeded' || yk.status === 'canceled')) {
      await syncPayment(admin, pay, yk);
      return json({ status: yk.status === 'succeeded' ? 'succeeded' : 'canceled' }, 409);
    }
  }

  const { data: orders, error: ordersErr } = await admin
    .from('orders')
    .select('id, number, shipping_price, order_items(title, quantity, price)')
    .eq('payment_id', pay.id)
    .eq('status', 'pending')
    .order('number');
  if (ordersErr || !orders?.length) return json({ error: 'Заказы для оплаты не найдены' }, 404);

  // deno-lint-ignore no-explicit-any
  const payload: any = {
    amount: { value: Number(pay.amount).toFixed(2), currency: 'RUB' },
    capture: true,
    confirmation: { type: 'redirect', return_url: `${siteUrl}/order/?payment=${pay.id}` },
    description: `Лили Вяжет: заказ ${orders.map((o) => '№' + o.number).join(', ')}`.slice(0, 128),
    metadata: { payment_id: pay.id },
  };

  if (env('YOOKASSA_SEND_RECEIPT') === 'true') {
    const vat = Number(env('YOOKASSA_VAT_CODE') || 1);
    const mode = env('YOOKASSA_PAYMENT_MODE') || 'full_prepayment';
    // deno-lint-ignore no-explicit-any
    const items: any[] = [];
    for (const o of orders) {
      // deno-lint-ignore no-explicit-any
      for (const it of (o as any).order_items ?? []) {
        items.push({
          description: String(it.title || 'Изделие ручной работы').slice(0, 128),
          quantity: Number(it.quantity),
          amount: { value: Number(it.price).toFixed(2), currency: 'RUB' },
          vat_code: vat,
          payment_mode: mode,
          payment_subject: 'commodity',
        });
      }
      if (Number(o.shipping_price) > 0) {
        items.push({
          description: `Доставка, заказ №${o.number}`,
          quantity: 1,
          amount: { value: Number(o.shipping_price).toFixed(2), currency: 'RUB' },
          vat_code: vat,
          payment_mode: mode,
          payment_subject: 'service',
        });
      }
    }
    const email = pay.customer_email || user.email;
    payload.receipt = { customer: { email }, items };
  }

  // Ключ идемпотентности: повторный запрос с теми же данными не создаст второй платёж
  const idemKey = `${pay.id}-${(await sha256Hex(JSON.stringify(payload))).slice(0, 12)}`;

  const res = await fetch(`${YK_API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: ykAuth,
      'Idempotence-Key': idemKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const yk = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Ошибка ЮKassa', res.status, yk);
    return json({ error: `Платёжная система не приняла запрос: ${yk?.description || res.status}` }, 502);
  }

  await admin
    .from('payments')
    .update({ provider_payment_id: yk.id, confirmation_url: yk.confirmation?.confirmation_url ?? null })
    .eq('id', pay.id);

  return json({ confirmation_url: yk.confirmation?.confirmation_url });
});
