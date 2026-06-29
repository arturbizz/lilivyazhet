import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/store';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    if (id)
      supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => setProduct(data));
  }, [id]);

  if (!product)
    return (
      <Layout>
        <p className="text-center py-20">Загрузка...</p>
      </Layout>
    );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-12 mt-8">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/500x400/F9A8D4/FFF?text=🧸'}
          className="w-full md:w-1/2 rounded-3xl shadow-lg object-cover"
        />
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-soft-rose">{product.title}</h1>
          <p className="text-3xl font-bold mt-4">{product.price} ₽</p>
          <p className="mt-6 text-lg text-soft-chocolate leading-relaxed">
            {product.description || 'Прекрасная ручная работа'}
          </p>
          <button
            onClick={() => {
              addItem(product);
              toast.success('Добавлено!');
            }}
            className="btn-primary mt-8 text-lg px-10 py-4"
          >
            Добавить в корзину
          </button>
        </div>
      </div>
    </Layout>
  );
}
