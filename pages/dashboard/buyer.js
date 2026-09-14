import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import OrderCard, { ORDER_SELECT } from '../../components/OrderCard';
import { Empty, Field, Loading, Modal, Notice, SectionTitle } from '../../components/Ui';
import { IconBox, IconCheck, IconStore, IconWallet, Spinner } from '../../components/Icons';
import { supabase, humanError } from '../../lib/supabase';
import { useAuth } from '../../lib/store';
import { dateRu } from '../../lib/format';

const APP_STATUS = {
  pending: { label: 'Заявка на рассмотрении', cls: 'bg-amber-50 text-amber-600 border border-amber-100' },
  approved: { label: 'Заявка одобрена', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  rejected: { label: 'Заявка отклонена', cls: 'bg-gray-50 text-gray-400 border border-gray-100' },
};

export default function BuyerDashboard() {
  const router = useRouter();
  const { user, profile, shop, ready, setProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [form, setForm] = useState({ shop_name: '', category: '', description: '', contact_info: '', portfolio_url: '' });

  useEffect(() => {
    if (ready && !user) router.replace('/login/?next=/dashboard/buyer/');
  }, [ready, user, router]);

  useEffect(() => {
    setName(profile?.full_name || '');
  }, [profile?.full_name]);

  const load = useCallback(async () => {
    if (!user) return;
    const [ords, apps] = await Promise.all([
      supabase
        .from('orders')
        .select(ORDER_SELECT + ',shop:shops(name,slug,avatar_url)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('master_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    ]);
    setOrders(ords.data || []);
    setApplication(apps.data?.[0] || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const saveName = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from('profiles').update({ full_name: name.trim().slice(0, 120) }).eq('id', user.id).select().maybeSingle();
    setBusy(false);
    if (error) return toast.error(humanError(error));
    setProfile(data);
    toast.success('Имя сохранено');
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.description.trim() || !form.contact_info.trim()) {
      return setError('Расскажите о работах и оставьте контакт — по нему мы свяжемся.');
    }
    setBusy(true);
    const { error: err } = await supabase.from('master_applications').insert({
      user_id: user.id,
      shop_name: form.shop_name.trim().slice(0, 80) || null,
      category: form.category.trim().slice(0, 60) || null,
      description: form.description.trim().slice(0, 2000),
      contact_info: form.contact_info.trim().slice(0, 200),
      portfolio_url: form.portfolio_url.trim().slice(0, 300) || null,
    });
    setBusy(false);
    if (err) return setError(humanError(err, 'Не удалось отправить заявку.'));
    toast.success('Заявка отправлена! Мы ответим в ближайшее время.');
    setOpen(false);
    load();
  };

  const confirmReceived = async (order) => {
    setBusy(true);
    const { error } = await supabase.rpc('update_order_status', { p_order_id: order.id, p_status: 'completed' });
    setBusy(false);
    if (error) return toast.error(humanError(error));
    toast.success('Спасибо! Отметили заказ как полученный');
    load();
  };

  if (!ready || loading) {
    return <Layout title="Мой кабинет"><Loading /></Layout>;
  }

  return (
    <Layout title="Мой кабинет">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-1">Мой кабинет</h1>
      <p className="text-gray-500 mb-8">Здравствуйте, {profile?.full_name || 'дорогой покупатель'}!</p>

      {/* Мастерская */}
      {shop ? (
        <div className="panel mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-semibold text-lg">У вас есть мастерская</h2>
            <p className="text-sm text-gray-500 mt-1">Работы, заказы и оформление страницы — в кабинете мастерицы.</p>
          </div>
          <Link href="/dashboard/master/" className="btn-primary"><IconStore size={17} /> Перейти</Link>
        </div>
      ) : application ? (
        <div className="panel mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="font-heading font-semibold text-lg">Заявка мастерицы</h2>
            <span className={`badge ${(APP_STATUS[application.status] || APP_STATUS.pending).cls}`}>
              {(APP_STATUS[application.status] || APP_STATUS.pending).label}
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            {application.status === 'pending'
              ? 'Мы читаем каждую заявку вручную. Обычно отвечаем за день‑два — вы получите доступ к кабинету мастерицы.'
              : application.status === 'approved'
              ? 'Заявка одобрена — обновите страницу, чтобы открыть мастерскую.'
              : application.admin_comment || 'К сожалению, в этот раз не получилось. Вы можете написать нам и попробовать снова.'}
          </p>
          <p className="text-xs text-gray-400 mt-3">Отправлена {dateRu(application.created_at)}</p>
        </div>
      ) : (
        <div className="panel mb-8 relative overflow-hidden">
          <div className="absolute inset-0 aurora-soft opacity-25" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="font-heading font-semibold text-lg">Хотите продавать свои работы?</h2>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                Откройте мастерскую: своя страница с фото и видео, витрина работ и заказы в одном месте.
                Площадка берёт 10% с суммы работ в оплаченном заказе — доставку вы оставляете себе полностью.
              </p>
            </div>
            <button onClick={() => setOpen(true)} className="btn-primary">Подать заявку</button>
          </div>
        </div>
      )}

      {/* Имя */}
      <div className="panel mb-8 max-w-lg">
        <Field label="Как к вам обращаться" hint="Это имя видят мастерицы в заказах.">
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" maxLength={120} />
            <button onClick={saveName} disabled={busy || !name.trim() || name === profile?.full_name} className="btn-secondary px-5">
              {busy ? <Spinner size={16} /> : <IconCheck size={17} />}
            </button>
          </div>
        </Field>
      </div>

      {/* Заказы */}
      <SectionTitle>Мои заказы</SectionTitle>
      {orders.length === 0 ? (
        <Empty icon={IconBox} title="Заказов пока нет"
          text="Загляните в каталог — там работы, которые существуют в одном экземпляре."
          action={<Link href="/catalog/" className="btn-primary">В каталог</Link>} />
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              mode="buyer"
              actions={
                <>
                  {o.status === 'pending' && (
                    <Link href={`/order/?payment=${o.payment_id}`} className="btn-primary text-sm py-2 px-5">
                      <IconWallet size={15} /> Оплатить
                    </Link>
                  )}
                  {o.status === 'shipped' && (
                    <button onClick={() => confirmReceived(o)} disabled={busy} className="btn-primary text-sm py-2 px-5">
                      <IconCheck size={15} /> Я получила заказ
                    </button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      {/* Заявка */}
      <Modal open={open} onClose={() => setOpen(false)} title="Заявка на открытие мастерской">
        <form onSubmit={submitApplication} className="space-y-4">
          <Field label="Название мастерской" hint="Можно изменить потом.">
            <input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
              className="input" placeholder="Лилины игрушки" maxLength={80} />
          </Field>
          <Field label="Что вы делаете">
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input" placeholder="Вязаные игрушки, амигуруми" maxLength={60} />
          </Field>
          <Field label="Расскажите о своих работах">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="textarea" rows={4} maxLength={2000}
              placeholder="Вяжу игрушки пять лет, продаю через знакомых. Хочу показать работы шире." required />
          </Field>
          <Field label="Как с вами связаться">
            <input value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
              className="input" placeholder="@telegram или почта" maxLength={200} required />
          </Field>
          <Field label="Ссылка на работы" hint="Профиль в соцсетях, папка с фото — что угодно.">
            <input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
              className="input" placeholder="https://vk.com/..." maxLength={300} />
          </Field>

          {error && <Notice type="error">{error}</Notice>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={busy} className="btn-primary flex-1 py-3">{busy ? <Spinner /> : 'Отправить заявку'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary px-6 py-3">Отмена</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
