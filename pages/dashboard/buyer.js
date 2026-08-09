import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function BuyerDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [showApplication, setShowApplication] = useState(false);
  const [appCategory, setAppCategory] = useState('вязаные');
  const [appDesc, setAppDesc] = useState('');
  const [appContact, setAppContact] = useState('');

  useEffect(() => {
    if (user) {
      // ✅ ИСПРАВЛЕНО: вернул звёздочки * в запрос
      supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('customer_id', user.id)
        .then(({ data }) => setOrders(data || []));
    }
  }, [user]);

  const submitApplication = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('master_applications').insert({
      user_id: user.id,
      category: appCategory,
      description: appDesc,
      contact_info: appContact,
    });

    if (error) toast.error(error.message);
    else {
      toast.success('Заявка отправлена! Мы рассмотрим её в ближайшее время.');
      setShowApplication(false);
      setAppDesc('');
      setAppContact('');
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-6">Личный кабинет</h1>
      <p className="mb-8 text-lg text-gray-600">Привет, {profile?.full_name || 'Покупатель'}!</p>

      {!showApplication ? (
        <>
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-2">Стать мастером ✨</h2>
            <p className="text-gray-600 mb-4">Хотите продавать свои работы и мастер‑классы? Отправьте заявку, и мы откроем вам магазин.</p>
            <button onClick={() => setShowApplication(true)} className="btn-primary">Подать заявку</button>
          </div>

          <h2 className="text-2xl font-heading font-semibold mb-4">Мои заказы</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">Заказов пока нет. Загляните в каталог!</p>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Заказ #{order.id.slice(0, 8)}</span>
                    <span className={`text-sm px-3 py-1 rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {order.status === 'pending' ? 'В обработке' : order.status}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {(order.order_items || []).map(item => (
                      <li key={item.id} className="flex justify-between border-b border-gray-50 pb-1">
                        <span>{item.products?.title || 'Товар'} × {item.quantity}</span>
                        <span>{item.price} ₽</span>
                      </li>
                    ))}
                  </ul>
                  <p className="font-bold mt-2 text-right">Итого: {order.total} ₽</p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card max-w-lg">
          <h2 className="text-2xl font-heading font-semibold mb-4">Заявка на статус мастера</h2>
          <form onSubmit={submitApplication} className="space-y-4">
            <select value={appCategory} onChange={e => setAppCategory(e.target.value)} className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green">
              <option value="вязаные">Вязаные игрушки</option>
              <option value="текстильные">Текстильные куклы</option>
              <option value="амигуруми">Амигуруми</option>
              <option value="другое">Другое</option>
            </select>
            <textarea value={appDesc} onChange={e => setAppDesc(e.target.value)} placeholder="Расскажите о ваших работах" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-aurora-green" rows="3" required />
            <input value={appContact} onChange={e => setAppContact(e.target.value)} placeholder="Контакт для связи (email/телеграм)" className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green" required />
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">Отправить</button>
              <button type="button" onClick={() => setShowApplication(false)} className="btn-secondary flex-1">Отмена</button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
