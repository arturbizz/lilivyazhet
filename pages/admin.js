import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import OrderCard, { ORDER_SELECT } from '../components/OrderCard';
import { ConfirmDialog, Empty, Field, Img, Loading, Modal, SectionTitle } from '../components/Ui';
import {
  IconBox, IconCheck, IconClipboard, IconEye, IconSettings, IconStore, IconUsers, IconWallet, Spinner, IconClose,
} from '../components/Icons';
import { supabase, humanError } from '../lib/supabase';
import { useAuth } from '../lib/store';
import { dateRu, rub } from '../lib/format';
import { shopUrl } from '../lib/config';

const TABS = [
  { key: 'applications', label: 'Заявки', icon: IconClipboard },
  { key: 'orders', label: 'Заказы', icon: IconBox },
  { key: 'payouts', label: 'Выплаты', icon: IconWallet },
  { key: 'shops', label: 'Мастерские', icon: IconStore },
  { key: 'users', label: 'Пользователи', icon: IconUsers },
  { key: 'settings', label: 'Настройки', icon: IconSettings },
];

const ROLE_LABEL = { buyer: 'Покупатель', master: 'Мастерица', admin: 'Администратор' };

export default function AdminPanel() {
  const router = useRouter();
  const { user, profile, ready } = useAuth();
  const [tab, setTab] = useState('applications');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [rate, setRate] = useState('10');
  const [reject, setReject] = useState(null);
  const [comment, setComment] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login/?next=/admin/');
    else if (profile && profile.role !== 'admin') {
      toast.error('Доступ только для администратора');
      router.replace('/');
    }
  }, [ready, user, profile, router]);

  const load = useCallback(async () => {
    if (profile?.role !== 'admin') return;
    const [apps, ords, shs, usrs, sett] = await Promise.all([
      supabase.from('master_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select(ORDER_SELECT + ',shop:shops(name,slug,avatar_url)').order('created_at', { ascending: false }).limit(200),
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.rpc('admin_list_users'),
      supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    setApplications(apps.data || []);
    setOrders(ords.data || []);
    setShops(shs.data || []);
    setUsers(usrs.data || []);
    setSettings(sett.data || null);
    if (sett.data) setRate(String(Math.round(Number(sett.data.commission_rate) * 1000) / 10));
    setLoading(false);
  }, [profile?.role]);

  useEffect(() => {
    if (profile?.role === 'admin') load();
  }, [profile?.role, load]);

  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const pending = applications.filter((a) => a.status === 'pending');
  const paidOrders = orders.filter((o) => ['paid', 'shipped', 'completed'].includes(o.status));
  const awaitingPayout = paidOrders.filter((o) => o.payout_status !== 'paid' && o.status === 'completed');

  const money = useMemo(() => {
    const gross = paidOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const commission = paidOrders.reduce((s, o) => s + Number(o.commission_amount || 0), 0);
    const owed = awaitingPayout.reduce((s, o) => s + Number(o.seller_amount || 0), 0);
    return { gross, commission, owed };
  }, [paidOrders, awaitingPayout]);

  const review = async (app, approve, text) => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_review_application', {
      p_id: app.id,
      p_approve: approve,
      p_comment: text || null,
    });
    setBusy(false);
    if (error) return toast.error(humanError(error));
    toast.success(approve ? 'Мастерская открыта' : 'Заявка отклонена');
    setReject(null);
    setComment('');
    load();
  };

  const markPayout = async (order, paid) => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_mark_payout', { p_order_id: order.id, p_paid: paid });
    setBusy(false);
    if (error) return toast.error(humanError(error));
    toast.success(paid ? 'Отмечено как выплаченное' : 'Отметка снята');
    load();
  };

  const setRole = async (u, role) => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_set_role', { p_user: u.id, p_role: role });
    setBusy(false);
    if (error) return toast.error(humanError(error));
    toast.success('Роль обновлена');
    load();
  };

  const openShop = async (u) => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_open_shop', { p_user: u.id });
    setBusy(false);
    if (error) return toast.error(humanError(error));
    toast.success('Мастерская открыта');
    load();
  };

  const saveRate = async () => {
    const value = Number(String(rate).replace(',', '.'));
    if (!Number.isFinite(value) || value < 0 || value >= 100) return toast.error('Введите комиссию от 0 до 99');
    setBusy(true);
    const { error } = await supabase.from('app_settings').update({ commission_rate: value / 100 }).eq('id', 1);
    setBusy(false);
    if (error) return toast.error(humanError(error));
    toast.success('Комиссия сохранена — она применится к новым заказам');
    load();
  };

  if (!ready || profile?.role !== 'admin' || loading) {
    return <Layout title="Админ‑панель"><Loading text="Проверяем доступ…" /></Layout>;
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return `${u.email || ''} ${u.full_name || ''}`.toLowerCase().includes(q);
  });

  return (
    <Layout title="Админ‑панель" wide>
      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-1">Панель администратора</h1>
      <p className="text-gray-500 mb-7">Площадка «Лили Вяжет»</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Stat label="Новых заявок" value={pending.length} accent={pending.length > 0} />
        <Stat label="Оборот" value={rub(money.gross)} />
        <Stat label="Комиссия площадки" value={rub(money.commission)} />
        <Stat label="К выплате мастерицам" value={rub(money.owed)} accent={money.owed > 0} />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-7 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`pill ${tab === t.key ? 'pill-active' : ''}`}>
            <t.icon size={15} /> {t.label}
            {t.key === 'applications' && pending.length > 0 && (
              <span className="bg-aurora-green text-white rounded-full px-1.5 text-[10px]">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'applications' && (
        <section className="space-y-4">
          {applications.length === 0 ? (
            <Empty icon={IconClipboard} title="Заявок пока нет" text="Когда покупательница захочет открыть мастерскую, заявка появится здесь." />
          ) : (
            applications.map((a) => {
              const u = usersById[a.user_id];
              return (
                <div key={a.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-heading font-semibold text-gray-900">{a.shop_name || u?.full_name || 'Без названия'}</p>
                      <p className="text-sm text-gray-400 mt-0.5 select-text">{u?.email || '—'} · {dateRu(a.created_at)}</p>
                    </div>
                    <span className={`badge ${
                      a.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : a.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-gray-50 text-gray-400 border border-gray-100'
                    }`}>
                      {a.status === 'pending' ? 'Ждёт ответа' : a.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                    </span>
                  </div>

                  {a.category && <p className="text-sm text-gray-500 mb-1">Направление: {a.category}</p>}
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{a.description}</p>
                  <p className="text-sm text-gray-500 mt-2 select-text">Контакт: {a.contact_info}</p>
                  {a.portfolio_url && (
                    <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer nofollow"
                      className="text-sm text-aurora-blue hover:underline break-all">
                      {a.portfolio_url}
                    </a>
                  )}
                  {a.admin_comment && <p className="text-sm text-gray-400 mt-3">Комментарий: {a.admin_comment}</p>}

                  {a.status === 'pending' && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button onClick={() => review(a, true)} disabled={busy} className="btn-primary text-sm py-2 px-5">
                        <IconCheck size={15} /> Одобрить и открыть мастерскую
                      </button>
                      <button onClick={() => { setReject(a); setComment(''); }} disabled={busy} className="btn-secondary text-sm py-2 px-5">
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      {tab === 'orders' && (
        <section>
          {orders.length === 0 ? (
            <Empty icon={IconBox} title="Заказов ещё не было" />
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} mode="admin"
                  actions={
                    <>
                      <span className="badge bg-gray-50 text-gray-500 border border-gray-100">
                        {o.shop?.name || 'мастерская удалена'}
                      </span>
                      {o.status === 'completed' && (
                        <button onClick={() => markPayout(o, o.payout_status !== 'paid')} disabled={busy}
                          className={o.payout_status === 'paid' ? 'btn-secondary text-sm py-2 px-4' : 'btn-primary text-sm py-2 px-4'}>
                          {o.payout_status === 'paid' ? 'Отменить выплату' : 'Отметить выплату'}
                        </button>
                      )}
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'payouts' && (
        <section>
          <SectionTitle>Ждут выплаты</SectionTitle>
          {awaitingPayout.length === 0 ? (
            <Empty icon={IconWallet} title="Всё выплачено"
              text="Здесь появляются полученные заказы, деньги по которым ещё не переведены мастерице." />
          ) : (
            <div className="panel p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="py-3 px-4 font-medium">Заказ</th>
                    <th className="py-3 px-4 font-medium">Мастерская</th>
                    <th className="py-3 px-4 font-medium">Сумма</th>
                    <th className="py-3 px-4 font-medium">Комиссия</th>
                    <th className="py-3 px-4 font-medium">К переводу</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {awaitingPayout.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                      <td className="py-3 px-4 whitespace-nowrap">№{o.number}</td>
                      <td className="py-3 px-4">{o.shop?.name || '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{rub(o.total)}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-400">−{rub(o.commission_amount)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold aurora-text">{rub(o.seller_amount)}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => markPayout(o, true)} disabled={busy} className="btn-primary text-xs py-1.5 px-4">
                          Выплачено
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'shops' && (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.length === 0 ? (
            <Empty icon={IconStore} title="Мастерских ещё нет" />
          ) : (
            shops.map((s) => (
              <div key={s.id} className="panel p-5 flex gap-4">
                <span className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <Img src={s.avatar_url} alt="" className="w-full h-full" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 line-clamp-1">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 select-text">/{s.slug}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge ${s.is_published ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                      {s.is_published ? 'Опубликована' : 'Скрыта'}
                    </span>
                    {s.is_published && (
                      <Link href={shopUrl(s.slug)} target="_blank" className="btn-icon w-8 h-8" aria-label="Открыть"><IconEye size={15} /></Link>
                    )}
                  </div>
                  {s.commission_rate !== null && s.commission_rate !== undefined && (
                    <p className="text-xs text-gray-400 mt-2">Своя комиссия: {Math.round(s.commission_rate * 100)}%</p>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'users' && (
        <section>
          <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="input max-w-sm mb-5"
            placeholder="Поиск по имени или почте" />
          <div className="panel p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-3 px-4 font-medium">Почта</th>
                  <th className="py-3 px-4 font-medium">Имя</th>
                  <th className="py-3 px-4 font-medium">Роль</th>
                  <th className="py-3 px-4 font-medium">Регистрация</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 px-4 select-text">{u.email || '—'}</td>
                    <td className="py-3 px-4">{u.full_name || '—'}</td>
                    <td className="py-3 px-4">
                      <select value={u.role} onChange={(e) => setRole(u, e.target.value)} disabled={busy || u.id === user.id}
                        className="input py-1.5 px-3 text-xs w-auto">
                        {Object.entries(ROLE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{dateRu(u.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      {!u.has_shop && (
                        <button onClick={() => openShop(u)} disabled={busy} className="btn-secondary text-xs py-1.5 px-4 whitespace-nowrap">
                          Открыть мастерскую
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'settings' && (
        <section className="max-w-lg">
          <div className="panel">
            <h3 className="font-heading font-semibold text-lg mb-4">Комиссия площадки</h3>
            <Field label="Процент с суммы работ"
              hint="Считается с суммы работ в оплаченном заказе, без доставки. Меняется только для новых заказов — в старых остаётся та, что была.">
              <div className="flex gap-2">
                <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" min="0" max="99" step="0.5" className="input" />
                <button onClick={saveRate} disabled={busy} className="btn-primary px-6">
                  {busy ? <Spinner size={16} /> : 'Сохранить'}
                </button>
              </div>
            </Field>
            {settings && (
              <p className="text-xs text-gray-400 mt-4">
                Сейчас: {Math.round(Number(settings.commission_rate) * 1000) / 10}% · обновлено {dateRu(settings.updated_at, true)}
              </p>
            )}
          </div>
        </section>
      )}

      <Modal open={Boolean(reject)} onClose={() => setReject(null)} title="Отклонить заявку" size="sm">
        <Field label="Что написать мастерице" hint="Она увидит этот текст в своём кабинете.">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="textarea" rows={3}
            placeholder="Пока не хватает фотографий работ — пришлите ещё и подайте заявку снова." />
        </Field>
        <div className="flex gap-3 mt-5">
          <button onClick={() => review(reject, false, comment)} disabled={busy} className="btn-danger flex-1 py-2.5">
            {busy ? <Spinner size={16} /> : 'Отклонить'}
          </button>
          <button onClick={() => setReject(null)} className="btn-secondary flex-1 py-2.5">Отмена</button>
        </div>
      </Modal>
    </Layout>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`panel p-4 sm:p-5 ${accent ? 'border-aurora-green/40' : ''}`}>
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <p className={`font-heading font-bold text-xl sm:text-2xl ${accent ? 'aurora-text' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
