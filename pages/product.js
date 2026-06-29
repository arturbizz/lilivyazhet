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
  const addItem = useCart(s => s.addItem);

  useEffect(() => {
    if (id) supabase.from('products').select('*').eq('id', id).single().then(({ data }) => setProduct(data));
  }, [id]);

  if (!product) return <Layout><p>Загрузка...</p></Layout>;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-8">
        <img src={product.images?.[0] || '/placeholder.png'} className="w-full md:w-1/2 rounded-3xl" />
        <div>
          <h1 className="text-3xl font-bold text-soft-rose">{product.title}</h1>
          <p className="text-2xl font-bold mt-2">{product.price} ₽</p>
          <p className="mt-4">{product.description}</p>
          <button onClick={() => { addItem(product); toast.success('Добавлено!'); }} className="btn-primary mt-6">Добавить в корзину</button>
        </div>
      </div>
    </Layout>
  );
}
