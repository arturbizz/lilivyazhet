import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';

const categories = [
  { value: '', label: 'Все' },
  { value: 'вязаные', label: 'Вязаные' },
  { value: 'текстильные', label: 'Текстильные' },
];

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
      <h1 className="text-4xl font-heading font-bold text-gray-900 mb-8">Каталог игрушек</h1>

      {/* Стильные фильтры-пилюли */}
      <div className="flex flex-wrap gap-3 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border
              ${category === cat.value
                ? 'border-aurora-green bg-aurora-green/5 text-aurora-green shadow-sm'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-20">Товаров пока нет</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
