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
  const [category, setCategory] = useState('вязаные');

  useEffect(() => {
    if (user)
      supabase.from('products').select('*').eq('seller_id', user.id).then(({ data }) => setProducts(data || []));
  }, [user]);

  const addProduct = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('products').insert({
      seller_id: user.id,
      title,
      price,
      description: desc,
      category,
    }).select();
    if (error) toast.error(error.message);
    else {
      setProducts([...products, data[0]]);
      toast.success('Товар добавлен!');
      setTitle('');
      setPrice('');
      setDesc('');
    }
  };

  return (
    <Layout>
      <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">Кабинет мастера</h1>
      <p className="text-lg text-gray-600 mb-10">Добро пожаловать, {profile?.full_name}!</p>

      <div className="grid lg:grid-cols-2 gap-10">
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

        {/* ИИ‑агент для мастер‑классов */}
        <div className="card">
          <h2 className="text-2xl font-heading font-semibold mb-4">🧠 ИИ‑помощник</h2>
          <p className="text-gray-600 mb-4">
            Опишите идею для мастер‑класса, и наш ИИ‑агент предложит структуру, этапы и материалы.
          </p>
          <textarea placeholder="Например: вязаный котёнок для начинающих" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-aurora-green mb-4" rows="4" />
          <button className="btn-primary w-full py-3" onClick={() => toast.success('Агент скоро заработает!')}>
            Сгенерировать мастер‑класс
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">Сейчас в разработке — совсем скоро запустим ✨</p>
        </div>
      </div>

      {/* Список товаров продавца */}
      <div className="mt-14">
        <h2 className="text-2xl font-heading font-semibold mb-6">🛍 Мои товары</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">У вас пока нет товаров</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="card">
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <p className="text-aurora-green font-bold">{p.price} ₽</p>
                <p className="text-sm text-gray-400">{p.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
