import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { Empty, SectionTitle, SkeletonCards } from '../components/Ui';
import { IconGift } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { PRODUCT_CARD_SELECT } from '../lib/config';

const BUDGETS = [
  { key: 'all', label: 'Любая цена', min: 0, max: 1e9 },
  { key: 'small', label: 'До 1500 ₽', min: 0, max: 1500 },
  { key: 'mid', label: '1500–4000 ₽', min: 1500, max: 4000 },
  { key: 'big', label: 'Дороже 4000 ₽', min: 4000, max: 1e9 },
];

const OCCASIONS = [
  { key: 'all', label: 'Любой повод', cats: [] },
  { key: 'kids', label: 'Ребёнку', cats: ['toys', 'kids'] },
  { key: 'her', label: 'Женщине', cats: ['jewelry', 'accessories', 'bags', 'cosmetics'] },
  { key: 'home', label: 'На новоселье', cats: ['home'] },
  { key: 'small', label: 'Небольшой знак внимания', cats: ['gifts', 'cosmetics', 'accessories'] },
];

export default function GiftIdeas() {
  const [products, setProducts] = useState(null);
  const [budget, setBudget] = useState('all');
  const [occasion, setOccasion] = useState('all');

  useEffect(() => {
    supabase
      .from('products')
      .select(PRODUCT_CARD_SELECT)
      .eq('status', 'active')
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .limit(120)
      .then(({ data }) => setProducts(data || []));
  }, []);

  const filtered = useMemo(() => {
    if (!products) return null;
    const b = BUDGETS.find((x) => x.key === budget);
    const o = OCCASIONS.find((x) => x.key === occasion);
    return products.filter((p) => {
      const price = Number(p.price) || 0;
      const okPrice = price >= b.min && price <= b.max;
      const okCat = !o.cats.length || o.cats.includes(p.category);
      return okPrice && okCat;
    });
  }, [products, budget, occasion]);

  return (
    <Layout title="Идеи для подарка">
      <div className="panel p-7 sm:p-9 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 aurora-soft opacity-30" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-2">Идеи для подарка</h1>
          <p className="text-gray-500 max-w-2xl leading-relaxed mb-6">
            Скажите, кому и на сколько — мы покажем работы, которые есть в наличии прямо сейчас.
          </p>

          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {OCCASIONS.map((o) => (
                <button key={o.key} onClick={() => setOccasion(o.key)} className={`pill ${occasion === o.key ? 'pill-active' : ''}`}>
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {BUDGETS.map((b) => (
                <button key={b.key} onClick={() => setBudget(b.key)} className={`pill ${budget === b.key ? 'pill-active' : ''}`}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionTitle
        right={filtered && <span className="text-sm text-gray-400 whitespace-nowrap">найдено: {filtered.length}</span>}
      >
        Подойдёт в подарок
      </SectionTitle>

      {filtered === null ? (
        <SkeletonCards count={6} />
      ) : filtered.length === 0 ? (
        <Empty
          icon={IconGift}
          title="Под эти условия ничего не нашлось"
          text="Попробуйте другой бюджет или посмотрите весь каталог — там наверняка найдётся что‑то подходящее."
          action={<Link href="/catalog/" className="btn-primary">Весь каталог</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      )}
    </Layout>
  );
}
