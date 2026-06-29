import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');

  useEffect(() => {
    let query = supabase.from('products').select('*');
    if (category) query = query.eq('category', category);
    query.then(({ data }) => setProducts(data || []));
  }, [category]);

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-soft-rose mb-8">Каталог игрушек</h1>
      <div className="flex justify-center mb-10">
        <select
          onChange={(e) => setCategory(e.target.value)}
          className="border-2 border-soft-rose rounded-full px-6 py-3 text-soft-chocolate bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-soft-rose"
        >
          <option value="">Все категории</option>
          <option value="вязаные">Вязаные</option>
          <option value="текстильные">Текстильные</option>
        </select>
      </div>
      {products.length === 0 ? (
        <p className="text-center text-soft-chocolate">Товаров пока нет</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
