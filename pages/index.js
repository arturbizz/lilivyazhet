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
      {/* Hero блок */}
      <section className="text-center my-16">
        <h1 className="text-5xl font-extrabold text-soft-rose mb-6 drop-shadow-sm">
          Добро пожаловать в ЛилиВяжет!
        </h1>
        <p className="text-xl text-soft-chocolate max-w-2xl mx-auto mb-8">
          Уютные игрушки ручной работы, мастер‑классы и вдохновение от талантливых мастеров
        </p>
        <Link href="/catalog" className="btn-primary text-lg px-10 py-4">
          Смотреть каталог
        </Link>
      </section>

      {/* Популярное */}
      <h2 className="text-3xl font-bold text-soft-rose text-center mb-10">
        ✨ Популярные игрушки
      </h2>
      {featured.length === 0 ? (
        <p className="text-center text-soft-chocolate">
          Пока нет товаров – станьте первым мастером!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
