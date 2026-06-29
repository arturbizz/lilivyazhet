import Layout from '../../components/Layout';
import { useAuth } from '../../lib/store';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function CustomerDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user)
      supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('customer_id', user.id)
        .then(({ data }) => setOrders(data || []));
  }, [user]);

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-soft-rose mb-4">Мои заказы</h1>
      <p className="text-lg mb-8">Привет, {profile?.full_name}!</p>
      {orders.length === 0 ? (
        <p>У вас пока нет заказов</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="card mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-lg">
                Заказ #{order.id.slice(0, 8)}
              </span>
              <span className="text-sm text-gray-400">
                {order.status === 'pending' ? 'В обработке' : order.status}
              </span>
            </div>
            <ul>
              {order.order_items.map((item) => (
                <li key={item.id} className="text-sm py-1">
                  {item.products?.title || 'Товар'} × {item.quantity} – {item.price} ₽
                </li>
              ))}
            </ul>
            <p className="font-bold mt-3">Итого: {order.total} ₽</p>
          </div>
        ))
      )}
    </Layout>
  );
}
