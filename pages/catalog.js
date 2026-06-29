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
      <h1 className="text-3xl font-bold text-soft-rose mb-6">Каталог игрушек</h1>
      <select onChange={e => setCategory(e.target.value)} className="border rounded-full px-4 py-2 mb-6">
        <option value="">Все категории</option>
        <option value="вязаные">Вязаные</option>
        <option value="текстильные">Текстильные</option>
      </select>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </Layout>
  );
}
