import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .limit(4)
      .then(({ data }) => setFeatured(data || []));
  }, []);

  return (
    <Layout>
      <section className="text-center my-16">
        <h1 className="text-5xl font-heading font-bold text-gray-900 mb-6">
          Добро пожаловать в ЛилиВяжет!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Уютные игрушки ручной работы, мастер‑классы и вдохновение от талантливых мастеров
        </p>
        <Link href="/catalog" className="btn-primary text-lg px-10 py-4">
          Смотреть готовые работы
        </Link>
      </section>

      {/* Разделитель с голографической линией */}
      <div className="flex items-center gap-4 mb-12">
        <div className="accent-line" />
        <h2 className="text-2xl font-heading font-semibold text-gray-800 whitespace-nowrap">
          Популярные игрушки
        </h2>
        <div className="accent-line" />
      </div>

      {featured.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          Пока нет товаров — станьте первым мастером!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
