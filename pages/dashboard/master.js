import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import OrderCard, { ORDER_SELECT } from '../../components/OrderCard';
import ShopEditor from '../../components/master/ShopEditor';
import ProductForm from '../../components/master/ProductForm';
import MediaManager from '../../components/master/MediaManager';
import { ConfirmDialog, Empty, Field, Img, Loading, Modal, SectionTitle } from '../../components/Ui';
import {
  IconBox, IconChart, IconEdit, IconEye, IconPlus, IconStore, IconTrash, IconTruck, IconVideo, IconWallet, Spinner,
} from '../../components/Icons';
import { supabase, humanError } from '../../lib/supabase';
import { useAuth } from '../../lib/store';
import { availability, plural, rub } from '../../lib/format';
import { productUrl, shopUrl } from '../../lib/config';
import { normalizeVideoInput, VIDEO_HELP } from '../../lib/video';

const TABS = [
  { key: 'orders', label: 'Заказы', icon: IconBox },
  { key: 'products', label: 'Работы', icon: IconStore },
  { key: 'media', label: 'Видео и фото', icon: IconVideo },
  { key: 'shop', label: 'Страница мастерской', icon: IconEdit },
  { key: 'masterclasses', label: 'Мастер‑классы', icon: IconChart },
];

const ORDER_FILTERS = [
  { key: 'active', label: 'Текущие' },
  { key: 'paid', label: 'Оплачены' },
  { key: 'shipped', label: 'Отправлены' },
  { key: 'completed', label: 'Получены' },
  { key: 'all', label: 'Все' },
];

export default function MasterDashboard() {
  const router = useRouter();
  const { user, profile, shop, ready, setShop } = useAuth();

  const [tab, setTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [media, setMedia] = useState([]);
  const [categories, setCategories] = useState([]);
  const [masterclasses, setMasterclasses] = useState([]);

  const [orderFilter, setOrderFilter] = useState('active');
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [shipDialog, setShipDialog] = useState(null);
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);
  const [mcOpen, setMcOpen] = useState(false);
  const [mc, setMc] = useState({ title: '', price: '', description: '', video_url: '' });

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login/?next=/dashboard/master/');
    else if (!shop) router.replace('/dashboard/buyer/');
  }, [ready, user, shop, router]);

  const loadAll = useCallback(async () => {
    if (!shop) return;
    const [prods, ords, med, cats, mcs] = await Promise.all([
      supabase.from('products').select('*').eq('seller_id', shop.id).order('created_at', { ascending: false }),
      supabase.from('orders').select(ORDER_SELECT).eq('seller_id', shop.id).order('created_at', { ascending: false }),
      supabase.from('shop_media').select('*, product:products(id,title,price)').eq('shop_id', shop.id).order('sort_order'),
      supabase.from('categories').select('slug,name').eq('is_active', true).order('sort_order'),
      supabase.from('masterclasses').select('*').eq('seller_id', shop.id).order('created_at', { ascending: false }),
    ]);
    setProducts(prods.data || []);
    setOrders(ords.data || []);
    setMedia(med.data || []);
    setCategories(cats.data || []);
    setMasterclasses(mcs.data || []);
    setLoading(false);
  }, [shop]);

  useEffect(() => {
    if (shop) loadAll();
  }, [shop, loadAll]);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => ['paid', 'shipped', 'completed'].includes(o.status));
    const earned = paid.reduce((s, o) => s + Number(o.seller_amount || 0), 0);
    const waiting = paid.filter((o) => o.payout_status !== 'paid').reduce((s, o) => s + Number(o.seller_amount || 0), 0);
    const toShip = orders.filter((o) => o.status === 'paid').length;
    return { sales: paid.length, earned, waiting, toShip, active: products.filter((p) => p.status === 'active').length };
  }, [orders, products]);

  const visibleOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    if (orderFilter === 'active') return orders.filter((o) => ['paid', 'shipped'].includes(o.status));
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const changeStatus = async (order, status, trackingNumber) => {
    setBusy(true);
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: order.id,
      p_status: status,
      p_tracking: trackingNumber || null,
      p_note: null,
    });
    setBusy(false);
    if (error) return toast.error(humanError(error));
    toast.success(status === 'shipped' ? 'Отметили как отправленный' : 'Статус обновлён');
    setShipDialog(null);
    setTracking('');
    loadAll();
  };

  const deleteProduct = async () => {
    setBusy(true);
    const { error } = await supabase.from('products').delete().eq('id', confirmDelete.id);
    setBusy(false);
    if (error) return toast.error(humanError(error, 'Работу нельзя удалить — она есть в заказах. Переведите её в архив.'));
    toast.success('Работа удалена');
    setConfirmDelete(null);
    loadAll();
  };

  const toggleStatus = async (product) => {
    const next = product.status === 'active' ? 'draft' : 'active';
    const { error } = await supabase.from('products').update({ status: next }).eq('id', product.id);
    if (error) return toast.error(humanError(error));
    toast.success(next === 'active' ? 'Работа снова в каталоге' : 'Работа скрыта из каталога');
    loadAll();
  };

  const saveMasterclass = async (e) => {
    e.preventDefault();
    if (!mc.title.trim()) return toast.error('Введите название мастер‑класса');
    let video = null;
    if (mc.video_url.trim()) {
      video = normalizeVideoInput(mc.video_url);
      if (!video) return toast.error('Не удалось разобрать ссылку на видео');
    }
    setBusy(true);
    const { error } = await supabase.from('masterclasses').insert({
      seller_id: shop.id,
      title: mc.title.trim().slice(0, 120),
      description: mc.description.trim().slice(0, 2000) || null,
      price: Math.max(0, Number(mc.price) || 0),
      video_url: video,
    });
    setBusy(false);
    if (error) return toast.error(humanError(error));
    toast.success('Мастер‑класс добавлен');
    setMcOpen(false);
    setMc({ title: '', price: '', description: '', video_url: '' });
    loadAll();
  };

  const deleteMasterclass = async (id) => {
    const { error } = await supabase.from('masterclasses').delete().eq('id', id);
    if (error) return toast.error(humanError(error));
    toast.success('Удалено');
    loadAll();
  };

  if (!ready || !shop || loading) {
    return <Layout title="Кабинет мастерицы"><Loading text="Открываем мастерскую…" /></Layout>;
  }

  return (
    <Layout title="Кабинет мастерицы" wide>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">Мастерская «{shop.name}»</h1>
          <p className="text-gray-500 mt-1">
            Здравствуйте, {profile?.full_name || 'мастерица'}!{' '}
            {shop.is_published ? 'Страница открыта для покупателей.' : 'Страница пока скрыта — включите показ на вкладке «Страница мастерской».'}
          </p>
        </div>
        {shop.is_published && (
          <Link href={shopUrl(shop.slug)} target="_blank" className="btn-secondary text-sm py-2.5 px-5">
            <IconEye size={16} /> Моя страница
          </Link>
        )}
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard icon={IconTruck} label="Ждут отправки" value={stats.toShip} accent={stats.toShip > 0} />
        <StatCard icon={IconBox} label="Продано" value={stats.sales} />
        <StatCard icon={IconWallet} label="Заработано" value={rub(stats.earned)} />
        <StatCard icon={IconChart} label="Ждёт выплаты" value={rub(stats.waiting)} />
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-7 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`pill ${tab === t.key ? 'pill-active' : ''}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <section>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5">
            {ORDER_FILTERS.map((f) => (
              <button key={f.key} onClick={() => setOrderFilter(f.key)}
                className={`pill text-xs py-2 px-4 ${orderFilter === f.key ? 'pill-active' : ''}`}>
                {f.label}
              </button>
            ))}
          </div>

          {visibleOrders.length === 0 ? (
            <Empty icon={IconBox} title="Заказов пока нет"
              text="Как только покупатель оплатит работу, заказ появится здесь вместе с адресом доставки." />
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {visibleOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  mode="seller"
                  actions={
                    <>
                      {o.status === 'paid' && (
                        <button onClick={() => { setShipDialog(o); setTracking(''); }} className="btn-primary text-sm py-2 px-5">
                          <IconTruck size={15} /> Отправила
                        </button>
                      )}
                      {o.status === 'shipped' && (
                        <span className="badge bg-violet-50 text-violet-500 border border-violet-100">
                          Ждём подтверждения покупателя
                        </span>
                      )}
                      {o.payout_status === 'paid' && (
                        <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-100">Выплачено</span>
                      )}
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'products' && (
        <section>
          <SectionTitle
            right={
              <button onClick={() => setEditing('new')} className="btn-primary text-sm py-2.5 px-5 whitespace-nowrap">
                <IconPlus size={16} /> Добавить работу
              </button>
            }
          >
            Мои работы
          </SectionTitle>

          {products.length === 0 ? (
            <Empty icon={IconStore} title="Ещё ни одной работы"
              text="Добавьте первую: фото, название, цена и пара слов о материалах. Это занимает пару минут."
              action={<button onClick={() => setEditing('new')} className="btn-primary"><IconPlus size={16} /> Добавить работу</button>} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => {
                const av = availability(p);
                return (
                  <div key={p.id} className="panel p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Img src={p.images?.[0]} alt="" className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-1">{p.title}</p>
                      <p className="text-sm aurora-text font-semibold mt-0.5">{rub(p.price)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {p.status === 'active' ? av.label : p.status === 'draft' ? 'Черновик' : 'В архиве'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <button onClick={() => setEditing(p)} className="btn-icon w-8 h-8" aria-label="Изменить"><IconEdit size={15} /></button>
                        <button onClick={() => toggleStatus(p)} className="btn-icon w-8 h-8"
                          aria-label={p.status === 'active' ? 'Скрыть' : 'Показать'} title={p.status === 'active' ? 'Скрыть из каталога' : 'Вернуть в каталог'}>
                          <IconEye size={15} />
                        </button>
                        <Link href={productUrl(p.id)} target="_blank" className="btn-icon w-8 h-8" aria-label="Открыть"><IconStore size={15} /></Link>
                        <button onClick={() => setConfirmDelete(p)} className="btn-icon w-8 h-8 hover:text-red-500" aria-label="Удалить"><IconTrash size={15} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'media' && (
        <section>
          <SectionTitle>Видео и фото мастерской</SectionTitle>
          <MediaManager shopId={shop.id} media={media} products={products} onChanged={loadAll} />
        </section>
      )}

      {tab === 'shop' && (
        <section className="max-w-3xl">
          <SectionTitle>Страница мастерской</SectionTitle>
          <ShopEditor shop={shop} onSaved={(s) => { if (s) setShop(s); loadAll(); }} />
        </section>
      )}

      {tab === 'masterclasses' && (
        <section>
          <SectionTitle
            right={
              <button onClick={() => setMcOpen(true)} className="btn-primary text-sm py-2.5 px-5 whitespace-nowrap">
                <IconPlus size={16} /> Добавить
              </button>
            }
          >
            Мои мастер‑классы
          </SectionTitle>

          {masterclasses.length === 0 ? (
            <Empty icon={IconVideo} title="Мастер‑классов пока нет"
              text="Расскажите, как вы делаете свои работы. Это привлекает покупателей и учеников." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {masterclasses.map((m) => (
                <div key={m.id} className="panel p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading font-semibold text-gray-900">{m.title}</h3>
                    <button onClick={() => deleteMasterclass(m.id)} className="text-gray-300 hover:text-red-500" aria-label="Удалить">
                      <IconTrash size={16} />
                    </button>
                  </div>
                  <p className="text-sm aurora-text font-semibold mt-1">{Number(m.price) > 0 ? rub(m.price) : 'Бесплатно'}</p>
                  {m.description && <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">{m.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Форма работы */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} size="lg"
        title={editing === 'new' ? 'Новая работа' : 'Изменить работу'}>
        {editing && (
          <ProductForm
            shopId={shop.id}
            categories={categories}
            product={editing === 'new' ? null : editing}
            onSaved={() => { setEditing(null); loadAll(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Отправка заказа */}
      <Modal open={Boolean(shipDialog)} onClose={() => setShipDialog(null)} title="Заказ отправлен" size="sm">
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Покупатель увидит трек‑номер в своём кабинете и сможет отследить посылку.
        </p>
        <Field label="Трек‑номер" hint="Если отправляете без трека (например, самовывоз) — оставьте пустым.">
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="input" placeholder="RA123456789RU" maxLength={60} />
        </Field>
        <div className="flex gap-3 mt-6">
          <button onClick={() => changeStatus(shipDialog, 'shipped', tracking)} disabled={busy} className="btn-primary flex-1 py-3">
            {busy ? <Spinner /> : 'Отметить отправленным'}
          </button>
          <button onClick={() => setShipDialog(null)} className="btn-secondary px-5 py-3">Отмена</button>
        </div>
      </Modal>

      {/* Новый мастер-класс */}
      <Modal open={mcOpen} onClose={() => setMcOpen(false)} title="Новый мастер‑класс">
        <form onSubmit={saveMasterclass} className="space-y-4">
          <Field label="Название">
            <input value={mc.title} onChange={(e) => setMc({ ...mc, title: e.target.value })} className="input"
              placeholder="Вяжем зайку за вечер" maxLength={120} required />
          </Field>
          <Field label="Цена, ₽" hint="Поставьте 0, если мастер‑класс бесплатный.">
            <input value={mc.price} onChange={(e) => setMc({ ...mc, price: e.target.value })} type="number" min="0" className="input" placeholder="0" />
          </Field>
          <Field label="Описание">
            <textarea value={mc.description} onChange={(e) => setMc({ ...mc, description: e.target.value })}
              className="textarea" rows={4} maxLength={2000} />
          </Field>
          <Field label="Ссылка на видео" hint={VIDEO_HELP}>
            <input value={mc.video_url} onChange={(e) => setMc({ ...mc, video_url: e.target.value })} className="input"
              placeholder="https://rutube.ru/video/..." />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={busy} className="btn-primary flex-1 py-3">{busy ? <Spinner /> : 'Добавить'}</button>
            <button type="button" onClick={() => setMcOpen(false)} className="btn-secondary px-6 py-3">Отмена</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Удалить работу?"
        text={`«${confirmDelete?.title || ''}» исчезнет из каталога. Если работа уже была в заказах, лучше перевести её в архив — история сохранится.`}
        onConfirm={deleteProduct}
        onClose={() => setConfirmDelete(null)}
        busy={busy}
      />
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`panel p-4 sm:p-5 ${accent ? 'border-aurora-green/40' : ''}`}>
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon size={16} />
        <span className="text-xs">{label}</span>
      </div>
      <p className={`font-heading font-bold text-xl sm:text-2xl ${accent ? 'aurora-text' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
