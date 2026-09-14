// =====================================================================
//  Edge Function «yookassa-webhook» — уведомления от ЮKassa
// ---------------------------------------------------------------------
//  Адрес для ЮKassa (Интеграция → HTTP-уведомления):
//    https://<ref-проекта>.supabase.co/functions/v1/yookassa-webhook
//  События: payment.succeeded, payment.canceled
//
//  ВАЖНО: в настройках этой функции ВЫКЛЮЧИТЕ «Enforce JWT verification» —
//  ЮKassa не умеет передавать токен Supabase.
//
//  Безопасность: мы не верим содержимому уведомления — берём из него только
//  id платежа и сами запрашиваем актуальный статус у ЮKassa по секретному ключу.
//  Секреты те же, что у create-payment: YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY.
// =====================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const YK_API = 'https://api.yookassa.ru/v3';
const env = (key: string) => Deno.env.get(key) ?? '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  const shopId = env('YOOKASSA_SHOP_ID');
  const secretKey = env('YOOKASSA_SECRET_KEY');
  if (!shopId || !secretKey) return new Response('not configured', { status: 500 });
  const ykAuth = 'Basic ' + btoa(`${shopId}:${secretKey}`);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('bad json', { status: 400 });
  }

  const event = String(body?.event ?? '');
  const objectId = String(body?.object?.id ?? '');
  if (!event.startsWith('payment.') || !/^[0-9a-z-]{10,64}$/i.test(objectId)) {
    return new Response('ignored');
  }

  // Актуальный статус — только из API ЮKassa
  let yk;
  try {
    const res = await fetch(`${YK_API}/payments/${encodeURIComponent(objectId)}`, {
      headers: { Authorization: ykAuth },
    });
    if (res.status === 404) return new Response('unknown payment');
    if (!res.ok) return new Response('retry later', { status: 500 }); // ЮKassa повторит уведомление
    yk = await res.json();
  } catch {
    return new Response('retry later', { status: 500 });
  }

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Ищем нашу оплату: по id платежа ЮKassa, а если его ещё не успели сохранить — по metadata
  let { data: pay } = await admin.from('payments').select('*').eq('provider_payment_id', yk.id).maybeSingle();
  if (!pay && yk.metadata?.payment_id && /^[0-9a-f-]{36}$/i.test(yk.metadata.payment_id)) {
    const r = await admin.from('payments').select('*').eq('id', yk.metadata.payment_id).maybeSingle();
    if (r.data && (!r.data.provider_payment_id || r.data.provider_payment_id === yk.id)) pay = r.data;
  }
  if (!pay) return new Response('payment not found');

  if (yk.status === 'succeeded') {
    const paid = Number(yk.amount?.value);
    if (!Number.isFinite(paid) || Math.abs(paid - Number(pay.amount)) > 0.009 || yk.amount?.currency !== 'RUB') {
      console.error('Сумма не совпадает', { paid, expected: pay.amount, payment: pay.id });
      return new Response('amount mismatch');
    }
    const { error } = await admin.rpc('mark_payment_succeeded', {
      p_payment_id: pay.id,
      p_provider_payment_id: yk.id,
    });
    if (error) {
      console.error(error);
      return new Response('db error', { status: 500 });
    }
  } else if (yk.status === 'canceled') {
    const { error } = await admin.rpc('mark_payment_canceled', { p_payment_id: pay.id });
    if (error) {
      console.error(error);
      return new Response('db error', { status: 500 });
    }
  }

  return new Response('ok');
});
