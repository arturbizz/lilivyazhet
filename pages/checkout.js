import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { Empty, Field, Img, Loading, Notice, SectionTitle } from '../components/Ui';
import { IconCart, IconTruck, Spinner } from '../components/Icons';
import { supabase, humanError } from '../lib/supabase';
import { syncCartWithDb, useAuth, useCart, useCartHydrated } from '../lib/store';
import { rub } from '../lib/format';

const CONTACT_KEY = 'lv-contact';

export default function Checkout() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const hydrated = useCartHydrated();
  const { user, profile, ready } = useAuth();

  const [shops, setShops] = useState({});
  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', comment: '' });

  useEffect(() => {
    if (ready && !user) router.replace('/login/?next=/checkout/');
  }, [ready, user, router]);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    (async () => {
      const { removed } = await syncCartWithDb();
      if (removed) toast('Часть работ уже разобрали — мы обновили корзину', { icon: '🧶' });
      const ids = [...new Set(useCart.getState().items.map((i) => i.seller_id).filter(Boolean))];
      if (ids.length) {
        const { data } = await supabase
          .from('shops')
          .select('id,name,slug,avatar_url,delivery_options,free_shipping_from,delivery_note,processing_days')
          .in('id', ids);
        if (!active) return;
        const map = Object.fromEntries((data || []).map((s) => [s.id, s]));
        setShops(map);
        const picks = {};
        Object.values(map).forEach((s) => {
          const opts = Array.isArray(s.delivery_options) ? s.delivery_options : [];
          if (opts.length) picks[s.id] = opts[0].id;
        });
        setDelivery(picks);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [hydrated]);

  useEffect(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}');
    } catch {
      saved = {};
    }
    setForm((f) => ({
      ...f,
      ...saved,
      name: saved.name || profile?.full_name || '',
      email: saved.email || user?.email || '',
    }));
  }, [profile?.full_name, user?.email]);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((i) => {
      const key = i.seller_id || 'other';
      if (!map.has(key)) map.set(key, { seller_id: key, items: [] });
      map.get(key).items.push(i);
    });
    return [...map.values()].map((g) => {
      const shop = shops[g.seller_id] || { name: g.items[0]?.shop_name || 'Мастерская', delivery_options: [] };
      const opts = Array.isArray(shop.delivery_options) ? shop.delivery_options : [];
      const itemsTotal = g.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const chosen = opts.find((o) => o.id === delivery[g.seller_id]) || opts[0] || null;
      let ship = chosen ? Number(chosen.price) || 0 : 0;
      const freeFrom = Number(shop.free_shipping_from) || 0;
      const freeShipping = freeFrom > 0 && itemsTotal >= freeFrom;
      if (freeShipping) ship = 0;
      return { ...g, shop, opts, itemsTotal, chosen, ship, freeShipping };
    });
  }, [items, shops, delivery]);

  const itemsTotal = groups.reduce((s, g) => s + g.itemsTotal, 0);
  const shipTotal = groups.reduce((s, g) => s + g.ship, 0);
  const total = itemsTotal + shipTotal;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Заполните имя, телефон и адрес — без них мастерица не сможет отправить заказ.');
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem(CONTACT_KEY, JSON.stringify(form));
    } catch {
      /* приватный режим браузера */
    }

    try {
      const { data: paymentId, error: rpcError } = await supabase.rpc('place_order', {
        p_items: items.map((i) => ({ product_id: i.id, qty: i.qty })),
        p_contact: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          comment: form.comment.trim(),
        },
        p_delivery: delivery,
      });
      if (rpcError) throw rpcError;

      clearCart();

      const { data: fn, error: fnError } = await supabase.functions.invoke('create-payment', {
        body: { payment_id: paymentId, action: 'create' },
      });
      if (!fnError && fn?.confirmation_url) {
        window.location.href = fn.confirmation_url;
        return;
      }
      // Оплата ещё не подключена или не ответила — заказ сохранён, продолжаем в кабинете
      router.push(`/order/?payment=${paymentId}`);
    } catch (err) {
      setError(humanError(err, 'Не получилось оформить заказ. Попробуйте ещё раз.'));
      setBusy(false);
    }
  };

  if (!ready || !hydrated || loading) {
    return <Layout title="Оформление заказа"><Loading text="Готовим заказ…" /></Layout>;
  }

  if (!items.length) {
    return (
      <Layout title="Оформление заказа">
        <Empty icon={IconCart} title="Корзина пуста"
          text="Добавьте работы в корзину — и вернитесь сюда."
          action={<Link href="/catalog/" className="btn-primary">В каталог</Link>} />
      </Layout>
    );
  }

  return (
    <Layout title="Оформление заказа">
      <SectionTitle>Оформление заказа</SectionTitle>

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-5">
          <div className="panel">
            <h3 className="font-heading font-semibold text-lg mb-5">Куда и кому отправить</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Имя и фамилия">
                <input value={form.name} onChange={set('name')} className="input" placeholder="Анна Иванова" required autoComplete="name" />
              </Field>
              <Field label="Телефон">
                <input value={form.phone} onChange={set('phone')} className="input" placeholder="+7 999 123‑45‑67" required type="tel" autoComplete="tel" />
              </Field>
              <Field label="Почта для чека" className="sm:col-span-2">
                <input value={form.email} onChange={set('email')} className="input" placeholder="anna@mail.ru" type="email" autoComplete="email" />
              </Field>
              <Field label="Адрес доставки" className="sm:col-span-2"
                hint="Индекс, город, улица, дом, квартира — или адрес пункта выдачи.">
                <textarea value={form.address} onChange={set('address')} className="textarea" rows={3}
                  placeholder="123456, Москва, ул. Пушкина, д. 1, кв. 2" required />
              </Field>
              <Field label="Комментарий мастерице" className="sm:col-span-2">
                <textarea value={form.comment} onChange={set('comment')} className="textarea" rows={2}
                  placeholder="Например: это подарок, добавьте открытку" />
              </Field>
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.seller_id} className="panel">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  <Img src={g.shop.avatar_url} alt="" className="w-full h-full" />
                </span>
                <div>
                  <p className="font-medium text-gray-900">{g.shop.name}</p>
                  <p className="text-xs text-gray-400">
                    {g.items.length} поз. · {rub(g.itemsTotal)}
                    {g.shop.processing_days > 0 && ` · отправит за ${g.shop.processing_days} дн.`}
                  </p>
                </div>
              </div>

              {g.opts.length > 0 ? (
                <div className="space-y-2">
                  {g.opts.map((o, i) => {
                    const chosen = (delivery[g.seller_id] || g.opts[0].id) === o.id;
                    const price = g.freeShipping ? 0 : Number(o.price) || 0;
                    return (
                      <label key={o.id || i}
                        className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border transition-colors ${
                          chosen ? 'border-aurora-green bg-aurora-green/5' : 'border-gray-100 hover:border-gray-200'
                        }`}>
                        <span className="flex items-center gap-3">
                          <input type="radio" name={`delivery-${g.seller_id}`} checked={chosen}
                            onChange={() => setDelivery((d) => ({ ...d, [g.seller_id]: o.id }))}
                            className="accent-[color:var(--a1)]" />
                          <span>
                            <span className="block text-sm font-medium text-gray-900">{o.name}</span>
                            {o.days && <span className="block text-xs text-gray-400 mt-0.5">{o.days}</span>}
                          </span>
                        </span>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {price > 0 ? rub(price) : 'Бесплатно'}
                        </span>
                      </label>
                    );
                  })}
                  {g.freeShipping && (
                    <p className="text-xs text-aurora-green ml-1">Доставка бесплатная — заказ от {rub(g.shop.free_shipping_from)}</p>
                  )}
                </div>
              ) : (
                <p className="flex items-start gap-2.5 text-sm text-gray-500 bg-gray-50 rounded-2xl px-4 py-3">
                  <IconTruck size={17} className="mt-0.5 text-gray-400" />
                  Мастерица обсудит доставку с вами после оплаты и напишет по указанным контактам.
                </p>
              )}
              {g.shop.delivery_note && <p className="hint">{g.shop.delivery_note}</p>}
            </div>
          ))}
        </div>

        <div className="panel p-6 lg:sticky lg:top-24">
          <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">Ваш заказ</h3>
          <div className="space-y-2.5 mb-4 max-h-56 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-600 line-clamp-1">{i.title} × {i.qty}</span>
                <span className="text-gray-900 whitespace-nowrap">{rub(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 my-4"><span className="accent-line" /></div>
          <div className="flex justify-between text-sm text-gray-500 mb-1.5">
            <span>Работы</span><span>{rub(itemsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>Доставка</span><span>{shipTotal > 0 ? rub(shipTotal) : 'бесплатно'}</span>
          </div>
          <div className="flex justify-between items-baseline mb-5">
            <span className="font-medium text-gray-900">К оплате</span>
            <span className="text-2xl font-bold aurora-text">{rub(total)}</span>
          </div>

          {error && <div className="mb-4"><Notice type="error">{error}</Notice></div>}

          <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-base">
            {busy ? <Spinner /> : 'Перейти к оплате'}
          </button>
          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
            Оплата картой через ЮKassa. Нажимая кнопку, вы соглашаетесь с правилами площадки
            и передаёте мастерице данные, нужные для доставки.
          </p>
        </div>
      </form>
    </Layout>
  );
}
