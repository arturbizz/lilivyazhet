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
      supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .then(({ data }) => setProducts(data || []));
  }, [user]);

  const addProduct = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('products')
      .insert({
        seller_id: user.id,
        title,
        price,
        description: desc,
        category,
      })
      .select();
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
      <h1 className="text-4xl font-bold text-soft-rose mb-4">Кабинет мастера</h1>
      <p className="text-lg mb-8">Добро пожаловать, {profile?.full_name}!</p>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Добавление товара */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">➕ Добавить игрушку</h2>
          <form onSubmit={addProduct} className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название"
              className="border-2 w-full px-4 py-3 rounded-full focus:outline-none focus:border-soft-rose"
              required
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Цена"
              type="number"
              className="border-2 w-full px-4 py-3 rounded-full focus:outline-none focus:border-soft-rose"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border-2 w-full px-4 py-3 rounded-full focus:outline-none focus:border-soft-rose"
            >
              <option value="вязаные">Вязаные</option>
              <option value="текстильные">Текстильные</option>
            </select>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Описание"
              className="border-2 w-full px-4 py-3 rounded-2xl focus:outline-none focus:border-soft-rose"
              rows="3"
            />
            <button className="btn-primary w-full py-3">Добавить</button>
          </form>
        </div>

        {/* Идея для мастер-класса */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">💡 Идеи для мастер‑классов</h2>
          <p className="text-soft-chocolate mb-4">
            Опишите задумку – ИИ‑помощник предложит структуру мастер‑класса
            (в разработке)
          </p>
          <textarea
            placeholder="Например: вязаный дракончик"
            className="border-2 w-full px-4 py-3 rounded-2xl focus:outline-none focus:border-soft-rose mb-3"
          />
          <button className="btn-secondary w-full">Сгенерировать идею (скоро)</button>
        </div>
      </div>

      {/* Список товаров продавца */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">🛍️ Мои товары</h2>
        {products.length === 0 ? (
          <p>У вас пока нет товаров</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="card">
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <p className="text-soft-rose font-bold">{p.price} ₽</p>
                <p className="text-sm text-gray-400">{p.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
