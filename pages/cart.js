import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { Empty, Img, Loading, SectionTitle } from '../components/Ui';
import { IconCart, IconMinus, IconPlus, IconTrash, IconArrowRight } from '../components/Icons';
import { syncCartWithDb, useCart, useCartHydrated, useAuth } from '../lib/store';
import { rub, plural, maxQty } from '../lib/format';
import { productUrl, shopUrl } from '../lib/config';

export default function Cart() {
  const { items, setQty, removeItem, clearCart } = useCart();
  const hydrated = useCartHydrated();
  const { user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    syncCartWithDb().then(({ removed, changed }) => {
      if (!active) return;
      if (removed) toast('Часть работ уже разобрали — мы убрали их из корзины', { icon: '🧶' });
      else if (changed) toast('Мы обновили цены и количество в корзине', { icon: '🧶' });
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [hydrated]);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((i) => {
      const key = i.seller_id || 'other';
      if (!map.has(key)) map.set(key, { seller_id: key, name: i.shop_name, slug: i.shop_slug, avatar: i.shop_avatar, items: [] });
      map.get(key).items.push(i);
    });
    return [...map.values()];
  }, [items]);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  if (!hydrated || checking) {
    return <Layout title="Корзина"><Loading text="Проверяем наличие…" /></Layout>;
  }

  if (!items.length) {
    return (
      <Layout title="Корзина">
        <Empty
          icon={IconCart}
          title="В корзине пока пусто"
          text="Загляните в каталог — там работы, которых больше нигде нет."
          action={<Link href="/catalog/" className="btn-primary">Смотреть работы</Link>}
        />
      </Layout>
    );
  }

  return (
    <Layout title="Корзина">
      <SectionTitle
        right={
          <button onClick={() => { clearCart(); toast('Корзина очищена'); }} className="text-sm text-gray-400 hover:text-red-500 whitespace-nowrap">
            Очистить
          </button>
        }
      >
        Корзина
      </SectionTitle>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-5">
          {groups.map((g) => (
            <div key={g.seller_id} className="panel p-5">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
                <span className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  <Img src={g.avatar} alt="" className="w-full h-full" />
                </span>
                {g.slug ? (
                  <Link href={shopUrl(g.slug)} className="font-medium text-gray-900 hover:text-gray-600">{g.name}</Link>
                ) : (
                  <span className="font-medium text-gray-900">{g.name}</span>
                )}
                <span className="text-xs text-gray-400 ml-auto">отдельная посылка</span>
              </div>

              <div className="space-y-4">
                {g.items.map((i) => (
                  <div key={i.id} className="flex gap-4">
                    <Link href={productUrl(i.id)} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Img src={i.image} alt={i.title} className="w-full h-full" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={productUrl(i.id)} className="font-medium text-gray-900 hover:text-gray-600 line-clamp-2 leading-snug">
                        {i.title}
                      </Link>
                      <p className="text-sm text-gray-400 mt-1">{rub(i.price)} за штуку</p>
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center border border-gray-200 rounded-full">
                          <button onClick={() => setQty(i.id, i.qty - 1)} disabled={i.qty <= 1}
                            className="px-3 py-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30" aria-label="Меньше">
                            <IconMinus size={14} />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold">{i.qty}</span>
                          <button onClick={() => setQty(i.id, i.qty + 1)} disabled={i.qty >= maxQty(i)}
                            className="px-3 py-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30" aria-label="Больше">
                            <IconPlus size={14} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(i.id)} className="text-gray-300 hover:text-red-500 transition-colors" aria-label="Удалить">
                          <IconTrash size={17} />
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 whitespace-nowrap">{rub(i.price * i.qty)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="panel p-6 lg:sticky lg:top-24">
          <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">Итого</h3>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{count} {plural(count, ['работа', 'работы', 'работ'])}</span>
            <span>{rub(total)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>Доставка</span>
            <span>на следующем шаге</span>
          </div>
          <div className="flex items-center gap-3 my-4"><span className="accent-line" /></div>
          <div className="flex justify-between items-baseline mb-5">
            <span className="font-medium text-gray-900">К оплате</span>
            <span className="text-2xl font-bold aurora-text">{rub(total)}</span>
          </div>
          <button
            onClick={() => router.push(user ? '/checkout/' : '/login/?next=/checkout/')}
            className="btn-primary w-full py-3.5 text-base"
          >
            Оформить заказ <IconArrowRight size={17} />
          </button>
          {groups.length > 1 && (
            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              Работы от разных мастериц приедут отдельными посылками — каждая отправляет свою.
              Оплата при этом одна.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
