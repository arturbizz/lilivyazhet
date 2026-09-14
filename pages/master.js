import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import ShortsReel from '../components/ShortsReel';
import VideoPlayer from '../components/VideoPlayer';
import { Empty, Img, Loading, Modal, SectionTitle } from '../components/Ui';
import { IconLink, IconPin, IconShare, IconTruck, IconStore, IconClock } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { PRODUCT_CARD_SELECT, absoluteUrl, shopUrl } from '../lib/config';
import { initials, plural, rub } from '../lib/format';
import { themeGradient, themeVars } from '../lib/themes';

const SOCIAL_LABELS = { telegram: 'Telegram', vk: 'ВКонтакте', instagram: 'Instagram', whatsapp: 'WhatsApp', site: 'Сайт' };

function socialHref(key, value) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  if (key === 'telegram') return `https://t.me/${handle}`;
  if (key === 'vk') return `https://vk.com/${handle}`;
  if (key === 'instagram') return `https://instagram.com/${handle}`;
  if (key === 'whatsapp') return `https://wa.me/${handle.replace(/\D/g, '')}`;
  return `https://${v}`;
}

const TABS = [
  { key: 'products', label: 'Работы' },
  { key: 'media', label: 'Видео и фото' },
  { key: 'about', label: 'О мастерской' },
];

export default function ShopPage() {
  const router = useRouter();
  const slug = typeof router.query.s === 'string' ? router.query.s : '';
  const [shop, setShop] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [media, setMedia] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('products');
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (!slug) {
      setShop(null);
      return;
    }
    let active = true;
    supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return;
        setShop(data || null);
        if (!data) return;
        const [{ data: prods }, { data: med }, { data: st }] = await Promise.all([
          supabase
            .from('products')
            .select(PRODUCT_CARD_SELECT)
            .eq('seller_id', data.id)
            .eq('status', 'active')
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false }),
          supabase
            .from('shop_media')
            .select('id,kind,url,poster_url,title,sort_order,product:products(id,title,price)')
            .eq('shop_id', data.id)
            .order('sort_order')
            .order('created_at', { ascending: false }),
          supabase.rpc('shop_stats', { p_shop: data.id }),
        ]);
        if (!active) return;
        setProducts(prods || []);
        setMedia(med || []);
        setStats(Array.isArray(st) ? st[0] : st);
      });
    return () => {
      active = false;
    };
  }, [router.isReady, slug]);

  const shorts = useMemo(() => media.filter((m) => m.kind === 'short'), [media]);
  const videos = useMemo(() => media.filter((m) => m.kind === 'video'), [media]);
  const photos = useMemo(() => media.filter((m) => m.kind === 'photo'), [media]);
  const socials = shop?.socials && typeof shop.socials === 'object' ? shop.socials : {};
  const delivery = Array.isArray(shop?.delivery_options) ? shop.delivery_options : [];

  const share = async () => {
    const url = absoluteUrl(shopUrl(shop.slug));
    try {
      if (navigator.share) await navigator.share({ title: shop.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована');
      }
    } catch {
      /* пользователь закрыл окно «Поделиться» */
    }
  };

  if (shop === undefined) {
    return (
      <Layout title="Мастерская">
        <Loading text="Открываем мастерскую…" />
      </Layout>
    );
  }

  if (!shop) {
    return (
      <Layout title="Мастерская не найдена">
        <Empty
          icon={IconStore}
          title="Такой мастерской нет"
          text="Возможно, ссылка устарела или мастерица ещё не опубликовала свою страницу."
          action={<Link href="/masters/" className="btn-primary">Все мастерицы</Link>}
        />
      </Layout>
    );
  }

  return (
    <Layout bare title={shop.name} description={shop.tagline || `Работы мастерской «${shop.name}»`}>
      <Head>
        <meta property="og:title" content={shop.name} />
        {shop.tagline && <meta property="og:description" content={shop.tagline} />}
        {shop.cover_url && <meta property="og:image" content={shop.cover_url} />}
      </Head>

      <div style={themeVars(shop.theme)}>
        {/* Обложка */}
        <div className="relative h-40 sm:h-64">
          {shop.cover_url ? (
            <Img src={shop.cover_url} alt="" className="absolute inset-0 w-full h-full" />
          ) : (
            <div className="absolute inset-0" style={{ background: themeGradient(shop.theme), opacity: 0.9 }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Шапка мастерской */}
          <div className="-mt-16 sm:-mt-20 relative flex flex-col sm:flex-row sm:items-end gap-5 mb-8">
            <div className="aurora-ring w-28 h-28 sm:w-32 sm:h-32">
              <div className="w-full h-full flex items-center justify-center bg-white">
                {shop.avatar_url ? (
                  <Img src={shop.avatar_url} alt={shop.name} className="w-full h-full" />
                ) : (
                  <span className="font-heading font-bold text-2xl text-gray-300">{initials(shop.name)}</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-2xl sm:text-4xl font-heading font-bold text-gray-900 leading-tight">{shop.name}</h1>
              {shop.tagline && <p className="text-gray-500 mt-1.5 leading-relaxed">{shop.tagline}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-400">
                {shop.city && (
                  <span className="flex items-center gap-1.5"><IconPin size={15} /> {shop.city}</span>
                )}
                {stats?.products_count > 0 && (
                  <span>{stats.products_count} {plural(Number(stats.products_count), ['работа', 'работы', 'работ'])}</span>
                )}
                {stats?.sales_count > 0 && (
                  <span>{stats.sales_count} {plural(Number(stats.sales_count), ['заказ', 'заказа', 'заказов'])}</span>
                )}
                {shop.processing_days > 0 && (
                  <span className="flex items-center gap-1.5">
                    <IconClock size={15} /> отправка за {shop.processing_days} {plural(shop.processing_days, ['день', 'дня', 'дней'])}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pb-1">
              {delivery.length > 0 && (
                <button onClick={() => setDeliveryOpen(true)} className="btn-secondary text-sm py-2.5 px-5">
                  <IconTruck size={16} /> Доставка
                </button>
              )}
              <button onClick={share} className="btn-icon w-11 h-11" aria-label="Поделиться">
                <IconShare size={17} />
              </button>
            </div>
          </div>

          {/* Соцсети */}
          {Object.keys(socials).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {Object.entries(socials).map(([key, value]) => {
                const href = socialHref(key, value);
                if (!href) return null;
                return (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow" className="pill">
                    <IconLink size={14} /> {SOCIAL_LABELS[key] || key}
                  </a>
                );
              })}
            </div>
          )}

          {/* Вкладки */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 border-b border-gray-100 pb-3">
            {TABS.map((t) => {
              const count = t.key === 'products' ? products.length : t.key === 'media' ? media.length : null;
              if (t.key === 'media' && media.length === 0) return null;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={`pill ${tab === t.key ? 'pill-active' : ''}`}>
                  {t.label}
                  {count ? <span className="opacity-60">{count}</span> : null}
                </button>
              );
            })}
          </div>

          {tab === 'products' && (
            <section className="mb-12">
              {products.length === 0 ? (
                <Empty title="Работы готовятся" text="Мастерица ещё не выложила изделия. Загляните чуть позже." />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={{ ...p, shop }} showShop={false} compact />
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'media' && (
            <section className="mb-12 space-y-12">
              {shorts.length > 0 && (
                <div>
                  <SectionTitle>Короткие видео</SectionTitle>
                  <ShortsReel items={shorts} />
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <SectionTitle>Полные видео</SectionTitle>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {videos.map((v) => (
                      <div key={v.id}>
                        <VideoPlayer url={v.url} poster={v.poster_url} title={v.title} />
                        {v.title && <p className="mt-2.5 font-medium text-gray-800">{v.title}</p>}
                        {v.product && (
                          <Link href={`/product/?id=${v.product.id}`} className="text-sm text-gray-500 hover:text-gray-900 mt-1 inline-block">
                            {v.product.title} · {rub(v.product.price)}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {photos.length > 0 && (
                <div>
                  <SectionTitle>Фотографии</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {photos.map((ph) => (
                      <div key={ph.id} className="rounded-2xl overflow-hidden aspect-square bg-gray-50 border border-gray-100">
                        <Img src={ph.url} alt={ph.title || ''} className="w-full h-full"
                          imgClassName="object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'about' && (
            <section className="mb-12 max-w-3xl">
              <div className="panel">
                {shop.bio ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{shop.bio}</p>
                ) : (
                  <p className="text-gray-400">Мастерица пока не рассказала о себе.</p>
                )}
                {shop.legal_name && (
                  <p className="text-xs text-gray-400 mt-6 pt-5 border-t border-gray-100">
                    Продавец: {shop.legal_name}
                    {shop.inn ? `, ИНН ${shop.inn}` : ''}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <Modal open={deliveryOpen} onClose={() => setDeliveryOpen(false)} title="Доставка и оплата">
        <ul className="space-y-3">
          {delivery.map((d, i) => (
            <li key={d.id || i} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{d.name}</p>
                {d.days && <p className="text-sm text-gray-400 mt-0.5">{d.days}</p>}
              </div>
              <span className="font-semibold text-gray-900 whitespace-nowrap">
                {Number(d.price) > 0 ? rub(d.price) : 'Бесплатно'}
              </span>
            </li>
          ))}
        </ul>
        {shop.free_shipping_from > 0 && (
          <p className="text-sm text-aurora-green mt-4">Бесплатная доставка от {rub(shop.free_shipping_from)}</p>
        )}
        {shop.delivery_note && <p className="text-sm text-gray-500 mt-4 leading-relaxed whitespace-pre-line">{shop.delivery_note}</p>}
        <p className="text-xs text-gray-400 mt-5 leading-relaxed">
          Оплата картой на сайте. Заказ собирает и отправляет мастерица — трек‑номер появится в вашем кабинете.
        </p>
      </Modal>
    </Layout>
  );
}
