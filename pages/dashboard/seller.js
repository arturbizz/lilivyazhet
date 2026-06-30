import Layout from '../../components/Layout';
import { useAuth } from '../../lib/store';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [masterclasses, setMasterclasses] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('вязаные');
  const [mcTitle, setMcTitle] = useState('');
  const [mcDesc, setMcDesc] = useState('');
  const [mcPrice, setMcPrice] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('products').select('*').eq('seller_id', user.id).then(({ data }) => setProducts(data || []));
      supabase.from('masterclasses').select('*').eq('seller_id', user.id).then(({ data }) => setMasterclasses(data || []));
    }
  }, [user]);

  const addProduct = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('products').insert({
      seller_id: user.id, title, price, description: desc, category,
    }).select();
    if (error) toast.error(error.message);
    else {
      setProducts([...products, data[0]]);
      toast.success('Товар добавлен!');
      setTitle(''); setPrice(''); setDesc('');
    }
  };

  const addMasterclass = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('masterclasses').insert({
      seller_id: user.id, title: mcTitle, description: mcDesc, price: mcPrice,
    }).select();
    if (error) toast.error(error.message);
    else {
      setMasterclasses([...masterclasses, data[0]]);
      toast.success('Мастер‑класс добавлен!');
      setMcTitle(''); setMcDesc(''); setMcPrice('');
    }
  };

  return (
    <Layout>
      <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">Кабинет мастера</h1>
      <p className="text-lg text-gray-600 mb-10">Добро пожаловать, {profile?.full_name}!</p>

      <div className="grid lg:grid-cols-2 gap-10 mb-12">
        {/* Добавление товара */}
        <div className="card">
          <h2 className="text-2xl font-heading font-semibold mb-6">➕ Новая игрушка</h2>
          <form onSubmit={addProduct} className="space-y-4">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название" className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green" required />
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Цена" type="number" className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green" required />
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green">
              <option value="вязаные">Вязаные</option>
              <option value="текстильные">Текстильные</option>
            </select>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Описание" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-aurora-green" rows="3" />
            <button className="btn-primary w-full py-3">Добавить товар</button>
          </form>
        </div>

        {/* Добавление мастер-класса */}
        <div className="card">
          <h2 className="text-2xl font-heading font-semibold mb-6">🎥 Новый мастер‑класс</h2>
          <form onSubmit={addMasterclass} className="space-y-4">
            <input value={mcTitle} onChange={e => setMcTitle(e.target.value)} placeholder="Название" className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green" required />
            <input value={mcPrice} onChange={e => setMcPrice(e.target.value)} placeholder="Цена (или 0, если бесплатно)" type="number" className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green" />
            <textarea value={mcDesc} onChange={e => setMcDesc(e.target.value)} placeholder="Описание" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-aurora-green" rows="3" />
            <button className="btn-primary w-full py-3">Добавить мастер‑класс</button>
          </form>
        </div>
      </div>

      {/* Список товаров */}
      <h2 className="text-2xl font-heading font-semibold mb-4">🛍 Мои товары</h2>
      {products.length === 0 ? <p className="text-gray-500">Нет товаров</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {products.map(p => (
            <div key={p.id} className="card">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-aurora-green font-bold">{p.price} ₽</p>
              <p className="text-sm text-gray-400">{p.category}</p>
            </div>
          ))}
        </div>
      )}

      {/* Список мастер-классов */}
      <h2 className="text-2xl font-heading font-semibold mb-4">🎬 Мои мастер‑классы</h2>
      {masterclasses.length === 0 ? <p className="text-gray-500">Нет мастер‑классов</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {masterclasses.map(mc => (
            <div key={mc.id} className="card">
              <h3 className="font-semibold">{mc.title}</h3>
              {mc.price > 0 && <p className="text-aurora-green font-bold">{mc.price} ₽</p>}
              <p className="text-sm text-gray-400">{mc.description}</p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
