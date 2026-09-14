import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import ShortsReel from '../components/ShortsReel';
import { SectionTitle, SkeletonCards, Empty } from '../components/Ui';
import ShopTeaser from '../components/ShopTeaser';
import { IconArrowRight, IconStore, IconYarn, IconGift, IconTruck, IconSpark } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { PRODUCT_CARD_SELECT, shopUrl } from '../lib/config';

const HOW = [
  { icon: IconYarn, title: 'Ручная работа', text: 'Каждую вещь делает живой человек — в единственном экземпляре или маленькой партией.' },
  { icon: IconStore, title: 'Мастерская с лицом', text: 'У каждой мастерицы своя страница: фото, видео, рассказ о работе и способы доставки.' },
  { icon: IconTruck, title: 'Отправляет мастерица', text: 'Она сама упакует и отправит заказ, а вы увидите трек‑номер в личном кабинете.' },
  { icon: IconGift, title: 'Оплата онлайн', text: 'Картой через ЮKassa. Деньги мастерице переводим после подтверждения заказа.' },
];

export default function Home() {
  const [products, setProducts] = useState(null);
  const [shorts, setShorts] = useState([]);
  const [shops, setShops] = useState([]);

  useEffect(() => {
    supabase
      .from('products')
      .select(PRODUCT_CARD_SELECT)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => setProducts(data || []));

    supabase
      .from('shop_media')
      .select('id,url,poster_url,title,kind,shop:shops(name,slug),product:products(id,title,price)')
      .eq('kind', 'short')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => setShorts(data || []));

    supabase
      .from('shops')
      .select('id,slug,name,tagline,city,avatar_url,cover_url,theme')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setShops(data || []));
  }, []);

  return (
    <Layout bare>
      {/* Первый экран */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 aurora-soft opacity-60" />
        <div className="relative max-w-5xl mx-auto px-5 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <span className="badge bg-white/80 text-gray-600 border border-gray-100 mb-5">
            <IconSpark size={13} className="text-aurora-green" /> Маркетплейс изделий ручной работы
          </span>
          <h1 className="text-3xl sm:text-5xl font-heading font-bold text-gray-900 leading-tight mb-4">
            Вещи, которые сделали <span className="aurora-text">руками</span>
            <br className="hidden sm:block" /> и от души
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Игрушки, одежда, украшения и подарки от частных мастериц.
            Загляните в мастерскую, посмотрите, как рождается вещь, и заберите её себе.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/catalog/" className="btn-primary px-7">Смотреть работы</Link>
            <Link href="/masters/" className="btn-secondary px-7">Наши мастерицы</Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        {/* Шортсы */}
        {shorts.length > 0 && (
          <section className="mb-14">
            <SectionTitle>Мастерская в кадре</SectionTitle>
            <ShortsReel items={shorts} showShop />
          </section>
        )}

        {/* Новинки */}
        <section className="mb-14">
          <SectionTitle
            right={
              <Link href="/catalog/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 whitespace-nowrap">
                Весь каталог <IconArrowRight size={15} />
              </Link>
            }
          >
            Новые работы
          </SectionTitle>

          {products === null ? (
            <SkeletonCards count={6} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" />
          ) : products.length === 0 ? (
            <Empty
              title="Работы скоро появятся"
              text="Мастерицы как раз раскладывают свои изделия по полочкам. Загляните чуть позже или откройте свою мастерскую."
              action={<Link href="/dashboard/buyer/" className="btn-primary">Открыть мастерскую</Link>}
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          )}
        </section>

        {/* Мастерицы */}
        {shops.length > 0 && (
          <section className="mb-14">
            <SectionTitle
              right={
                <Link href="/masters/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 whitespace-nowrap">
                  Все мастерицы <IconArrowRight size={15} />
                </Link>
              }
            >
              Загляните в мастерские
            </SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {shops.map((s) => (
                <ShopTeaser key={s.id} shop={s} />
              ))}
            </div>
          </section>
        )}

        {/* Как это работает */}
        <section className="mb-8">
          <SectionTitle>Как это работает</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW.map(({ icon: Icon, title, text }) => (
              <div key={title} className="panel p-6">
                <div className="w-11 h-11 rounded-2xl aurora-chip mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="font-heading font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Приглашение мастерицам */}
        <section className="panel p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 aurora-soft opacity-30" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-3">Вы тоже мастерица?</h2>
            <p className="text-gray-500 max-w-xl mx-auto mb-6 leading-relaxed">
              Откройте свою страницу: загрузите фото и видео работ, расскажите о себе, назначьте цены и способы доставки.
              Площадка берёт 10% с оплаченного заказа — и только с суммы товаров, без доставки.
            </p>
            <Link href="/dashboard/buyer/" className="btn-primary px-7">Открыть мастерскую</Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
