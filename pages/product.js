import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import VideoPlayer from '../components/VideoPlayer';
import { Empty, Img, Loading, Modal, SectionTitle } from '../components/Ui';
import { IconCart, IconCheck, IconMinus, IconPlus, IconShare, IconTruck, IconVideo, IconYarn, IconChevronLeft, IconChevronRight } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/store';
import { PRODUCT_CARD_SELECT, absoluteUrl, productUrl, shopUrl } from '../lib/config';
import { availability, initials, maxQty, rub } from '../lib/format';
import { themeVars } from '../lib/themes';

export default function ProductPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [product, setProduct] = useState(undefined);
  const [more, setMore] = useState([]);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [zoom, setZoom] = useState(false);

  const addItem = useCart((s) => s.addItem);
  const inCart = useCart((s) => s.items.find((i) => i.id === id)?.qty || 0);

  useEffect(() => {
    if (!router.isReady || !id) {
      if (router.isReady) setProduct(null);
      return;
    }
    let active = true;
    setProduct(undefined);
    setActive(0);
    setQty(1);
    supabase
      .from('products')
      .select('*, shop:shops(*)')
      .eq('id', id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return;
        setProduct(data || null);
        if (!data) return;
        const { data: others } = await supabase
          .from('products')
          .select(PRODUCT_CARD_SELECT)
          .eq('seller_id', data.seller_id)
          .eq('status', 'active')
          .neq('id', data.id)
          .limit(4);
        if (active) setMore(others || []);
      });
    return () => {
      active = false;
    };
  }, [router.isReady, id]);

  const images = useMemo(() => (product?.images || []).filter(Boolean), [product]);
  const avail = availability(product);
  const limit = maxQty(product);
  const delivery = Array.isArray(product?.shop?.delivery_options) ? product.shop.delivery_options : [];
  const minDelivery = delivery.length ? Math.min(...delivery.map((d) => Number(d.price) || 0)) : null;

  const add = () => {
    if (!avail.ok) return;
    if (addItem(product, qty)) toast.success('Добавлено в корзину');
    else toast('В корзине уже всё, что есть в наличии', { icon: '🧶' });
  };

  const share = async () => {
    const url = absoluteUrl(productUrl(product.id));
    try {
      if (navigator.share) await navigator.share({ title: product.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована');
      }
    } catch {
      /* окно закрыли */
    }
  };

  if (product === undefined) {
    return <Layout title="Работа"><Loading /></Layout>;
  }
  if (!product) {
    return (
      <Layout title="Работа не найдена">
        <Empty icon={IconYarn} title="Такой работы нет"
          text="Возможно, мастерица сняла её с продажи или ссылка устарела."
          action={<Link href="/catalog/" className="btn-primary">В каталог</Link>} />
      </Layout>
    );
  }

  return (
    <Layout title={product.title} description={product.description?.slice(0, 160)}>
      <Head>
        <meta property="og:title" content={product.title} />
        {images[0] && <meta property="og:image" content={images[0]} />}
      </Head>

      <div style={themeVars(product.shop?.theme)}>
        <nav className="text-sm text-gray-400 mb-5 flex flex-wrap items-center gap-2">
          <Link href="/catalog/" className="hover:text-gray-700">Каталог</Link>
          <span>/</span>
          {product.shop?.slug ? (
            <Link href={shopUrl(product.shop.slug)} className="hover:text-gray-700">{product.shop.name}</Link>
          ) : (
            <span>Мастерская</span>
          )}
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Галерея */}
          <div>
            <div className="relative rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 aspect-square">
              <button type="button" onClick={() => images.length && setZoom(true)} className="w-full h-full block">
                <Img src={images[active]} alt={product.title} className="w-full h-full" imgClassName="object-cover" />
              </button>
              {images.length > 1 && (
                <>
                  <button onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 btn-icon shadow-md" aria-label="Предыдущее фото">
                    <IconChevronLeft size={18} />
                  </button>
                  <button onClick={() => setActive((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon shadow-md" aria-label="Следующее фото">
                    <IconChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto scrollbar-hide">
                {images.map((src, i) => (
                  <button key={src + i} onClick={() => setActive(i)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === active ? 'border-aurora-green' : 'border-transparent hover:border-gray-200'
                    }`}>
                    <Img src={src} alt="" className="w-full h-full" />
                  </button>
                ))}
              </div>
            )}

            {product.video_url && (
              <div className="mt-5">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2.5">
                  <IconVideo size={16} /> Видео работы
                </p>
                <VideoPlayer url={product.video_url} poster={images[0]} title={product.title} />
              </div>
            )}
          </div>

          {/* Описание и покупка */}
          <div>
            {product.shop?.slug && (
              <Link href={shopUrl(product.shop.slug)} className="inline-flex items-center gap-3 mb-5 group">
                <span className="aurora-ring w-11 h-11">
                  <span className="w-full h-full flex items-center justify-center bg-white">
                    {product.shop.avatar_url ? (
                      <Img src={product.shop.avatar_url} alt="" className="w-full h-full" />
                    ) : (
                      <span className="text-xs font-heading font-bold text-gray-400">{initials(product.shop.name)}</span>
                    )}
                  </span>
                </span>
                <span>
                  <span className="block font-medium text-gray-900 group-hover:text-gray-700">{product.shop.name}</span>
                  <span className="block text-xs text-gray-400">{product.shop.city || 'Мастерская'}</span>
                </span>
              </Link>
            )}

            <h1 className="text-2xl sm:text-4xl font-heading font-bold text-gray-900 leading-tight mb-3">{product.title}</h1>
            <p className="text-3xl font-bold aurora-text mb-2">{rub(product.price)}</p>
            <p className={`text-sm mb-6 ${avail.ok ? 'text-gray-500' : 'text-red-400'}`}>{avail.label}</p>

            {avail.ok ? (
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3 text-gray-500 hover:text-gray-900" aria-label="Меньше">
                    <IconMinus size={16} />
                  </button>
                  <span className="w-10 text-center font-semibold">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(limit, q + 1))} className="px-4 py-3 text-gray-500 hover:text-gray-900" aria-label="Больше">
                    <IconPlus size={16} />
                  </button>
                </div>
                <button onClick={add} className="btn-primary flex-1 min-w-[200px] py-3.5 text-base">
                  <IconCart size={18} /> Добавить в корзину
                </button>
                <button onClick={share} className="btn-icon w-12 h-12" aria-label="Поделиться">
                  <IconShare size={17} />
                </button>
              </div>
            ) : (
              <div className="panel p-5 mb-5 text-sm text-gray-500">
                Этой работы сейчас нет. Загляните в мастерскую — там есть другие изделия,
                а многие мастерицы делают повтор на заказ.
              </div>
            )}

            {inCart > 0 && (
              <p className="flex items-center gap-2 text-sm text-aurora-green mb-5">
                <IconCheck size={16} /> В корзине: {inCart} шт.{' '}
                <Link href="/cart/" className="underline">Перейти к оформлению</Link>
              </p>
            )}

            {delivery.length > 0 && (
              <button onClick={() => setDeliveryOpen(true)}
                className="w-full panel p-4 flex items-center justify-between gap-3 text-left mb-5 hover:border-gray-200 transition-colors">
                <span className="flex items-center gap-3">
                  <IconTruck size={19} className="text-gray-400" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Доставка от мастерицы</span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {minDelivery === 0 ? 'Есть бесплатный вариант' : `от ${rub(minDelivery)}`}
                      {product.shop?.free_shipping_from > 0 && ` · бесплатно от ${rub(product.shop.free_shipping_from)}`}
                    </span>
                  </span>
                </span>
                <IconChevronRight size={18} className="text-gray-300" />
              </button>
            )}

            {product.description && (
              <div className="prose-sm">
                <h2 className="font-heading font-semibold text-gray-900 mb-2">Описание</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {more.length > 0 && (
          <section className="mb-10">
            <SectionTitle
              right={
                product.shop?.slug && (
                  <Link href={shopUrl(product.shop.slug)} className="text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap">
                    Вся мастерская
                  </Link>
                )
              }
            >
              Другие работы мастерицы
            </SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {more.map((p) => (
                <ProductCard key={p.id} product={p} showShop={false} compact />
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal open={zoom} onClose={() => setZoom(false)} title={product.title} size="lg">
        <Img src={images[active]} alt={product.title} className="w-full rounded-2xl" imgClassName="object-contain" />
      </Modal>

      <Modal open={deliveryOpen} onClose={() => setDeliveryOpen(false)} title="Как доставят заказ">
        <ul className="space-y-3">
          {delivery.map((d, i) => (
            <li key={d.id || i} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{d.name}</p>
                {d.days && <p className="text-sm text-gray-400 mt-0.5">{d.days}</p>}
              </div>
              <span className="font-semibold whitespace-nowrap">{Number(d.price) > 0 ? rub(d.price) : 'Бесплатно'}</span>
            </li>
          ))}
        </ul>
        {product.shop?.free_shipping_from > 0 && (
          <p className="text-sm text-aurora-green mt-4">Бесплатная доставка от {rub(product.shop.free_shipping_from)}</p>
        )}
        {product.shop?.delivery_note && (
          <p className="text-sm text-gray-500 mt-4 leading-relaxed whitespace-pre-line">{product.shop.delivery_note}</p>
        )}
      </Modal>
    </Layout>
  );
}
