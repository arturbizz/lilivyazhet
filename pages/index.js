import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    supabase.from('products').select('*').limit(4).then(({ data }) => setFeatured(data || []));
  }, []);

  return (
    <Layout>
      <section className="text-center my-12">
        <h1 className="text-4xl font-bold text-soft-rose mb-4">Добро пожаловать в ЛилиВяжет!</h1>
        <p className="text-lg text-soft-chocolate">Уютные игрушки ручной работы и мастер‑классы от лучших мастеров</p>
        <Link href="/catalog" className="btn-primary inline-block mt-6">Смотреть каталог</Link>
      </section>
      <h2 className="text-2xl font-semibold text-soft-rose mb-6">Популярные игрушки</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featured.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </Layout>
  );
}
