import Layout from '../../components/Layout';
import { useAuth } from '../../lib/store';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (user) supabase.from('products').select('*').eq('seller_id', user.id).then(({ data }) => setProducts(data || []));
  }, [user]);

  const addProduct = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('products').insert({
      seller_id: user.id,
      title,
      price,
      description: desc
    }).select();
    if (error) toast.error(error.message);
    else {
      setProducts([...products, data[0]]);
      toast.success('Товар добавлен!');
      setTitle(''); setPrice(''); setDesc('');
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-soft-rose">Кабинет мастера</h1>
      <p className="mb-6">Добро пожаловать, {profile?.full_name}!</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Добавить игрушку</h2>
          <form onSubmit={addProduct} className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название" className="border w-full px-3 py-2 rounded-full" required />
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Цена" type="number" className="border w-full px-3 py-2 rounded-full" required />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Описание" className="border w-full px-3 py-2 rounded-2xl" />
            <button className="btn-primary w-full">Добавить</button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Идеи для мастер‑классов</h2>
          <p className="text-sm mb-3">Опиши, что хочешь создать – ИИ‑помощник подскажет структуру мастер‑класса (пока в разработке)</p>
          <textarea placeholder="Например: вязаный дракончик" className="border w-full px-3 py-2 rounded-2xl mb-2" />
          <button className="btn-secondary w-full">Сгенерировать идею (скоро)</button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Мои товары</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="card">
              <h3 className="font-semibold">{p.title}</h3>
              <p>{p.price} ₽</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
