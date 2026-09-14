import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import OrderCard, { ORDER_SELECT } from '../components/OrderCard';
import { Empty, Loading, Notice } from '../components/Ui';
import { IconCheckCircle, IconClock, IconWallet, Spinner } from '../components/Icons';
import { supabase, humanError } from '../lib/supabase';
import { useAuth } from '../lib/store';
import { rub } from '../lib/format';

/* Страница после оплаты: ?payment=<id> */
export default function OrderStatusPage() {
  const router = useRouter();
  const paymentId = typeof router.query.payment === 'string' ? router.query.payment : '';
  const { user, ready } = useAuth();
  const [payment, setPayment] = useState(undefined);
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const tries = useRef(0);

  const load = async () => {
    const [{ data: pay }, { data: ords }] = await Promise.all([
      supabase.from('payments').select('*').eq('id', paymentId).maybeSingle(),
      supabase.from('orders').select(ORDER_SELECT + ',shop:shops(name,slug,avatar_url)').eq('payment_id', paymentId).order('number'),
    ]);
    setPayment(pay || null);
    setOrders(ords || []);
    return pay;
  };

  useEffect(() => {
    if (!router.isReady || !ready) return undefined;
    if (!user) {
      router.replace(`/login/?next=${encodeURIComponent(`/order/?payment=${paymentId}`)}`);
      return undefined;
    }
    if (!paymentId) {
      setPayment(null);
      return undefined;
    }
    let active = true;
    let timer;

    const tick = async () => {
      const pay = await load();
      if (!active) return;
      // Пока ЮKassa не прислала уведомление — переспрашиваем статус
      if (pay?.status === 'pending' && tries.current < 10) {
        tries.current += 1;
        supabase.functions.invoke('create-payment', { body: { payment_id: paymentId, action: 'check' } }).catch(() => {});
        timer = setTimeout(tick, 3000);
      }
    };
    tick();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [router.isReady, ready, user, paymentId]);

  const payNow = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { payment_id: paymentId, action: 'create' },
      });
      if (error) throw error;
      if (data?.confirmation_url) {
        window.location.href = data.confirmation_url;
        return;
      }
      toast.error(data?.error || 'Оплата пока недоступна. Мы свяжемся с вами.');
    } catch (e) {
      toast.error(humanError(e, 'Оплата пока недоступна. Мы свяжемся с вами.'));
    }
    setBusy(false);
  };

  const cancel = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('cancel_payment', { p_payment_id: paymentId });
    if (error) toast.error(humanError(error));
    else {
      toast.success('Заказ отменён');
      await load();
    }
    setBusy(false);
  };

  if (!ready || payment === undefined) {
    return <Layout title="Заказ"><Loading text="Проверяем оплату…" /></Layout>;
  }
  if (!payment) {
    return (
      <Layout title="Заказ">
        <Empty title="Заказ не найден" text="Проверьте ссылку или откройте список заказов в кабинете."
          action={<Link href="/dashboard/buyer/" className="btn-primary">Мои заказы</Link>} />
      </Layout>
    );
  }

  const succeeded = payment.status === 'succeeded';
  const canceled = payment.status === 'canceled';

  return (
    <Layout title={succeeded ? 'Заказ оплачен' : 'Ваш заказ'}>
      <div className="max-w-3xl mx-auto">
        <div className="panel p-7 sm:p-9 text-center mb-8 relative overflow-hidden">
          <div className={`absolute inset-0 ${succeeded ? 'aurora-soft opacity-40' : ''}`} />
          <div className="relative">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
              succeeded ? 'bg-aurora-green/10 text-aurora-green' : canceled ? 'bg-gray-100 text-gray-400' : 'bg-amber-50 text-amber-500'
            }`}>
              {succeeded ? <IconCheckCircle size={30} /> : canceled ? <IconWallet size={28} /> : <IconClock size={28} />}
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-3">
              {succeeded ? 'Спасибо! Заказ оплачен' : canceled ? 'Заказ отменён' : 'Заказ ждёт оплаты'}
            </h1>
            <p className="text-gray-500 leading-relaxed max-w-lg mx-auto">
              {succeeded
                ? 'Мастерица уже видит ваш заказ. Когда она отправит посылку, в кабинете появится трек‑номер.'
                : canceled
                ? 'Эта покупка отменена. Работы остались в каталоге — можно оформить заказ заново.'
                : 'Мы сохранили заказ. Оплатите его, чтобы мастерица начала собирать посылку.'}
            </p>

            {!succeeded && !canceled && (
              <>
                <p className="text-3xl font-bold aurora-text mt-6 mb-5">{rub(payment.amount)}</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={payNow} disabled={busy} className="btn-primary px-8 py-3">
                    {busy ? <Spinner /> : 'Оплатить'}
                  </button>
                  <button onClick={cancel} disabled={busy} className="btn-secondary px-6 py-3">Отменить заказ</button>
                </div>
                <div className="mt-6 text-left">
                  <Notice>
                    Если оплата не открывается, значит ЮKassa ещё не подключена. Заказ уже сохранён —
                    свяжитесь с мастерицей, и она подскажет, как оплатить.
                  </Notice>
                </div>
              </>
            )}

            {succeeded && (
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <Link href="/dashboard/buyer/" className="btn-primary px-7">Мои заказы</Link>
                <Link href="/catalog/" className="btn-secondary px-7">Смотреть дальше</Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} mode="buyer" />
          ))}
        </div>
      </div>
    </Layout>
  );
}
