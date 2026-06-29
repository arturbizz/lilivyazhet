import Layout from '../../components/Layout';
import { useAuth } from '../../lib/store';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function CustomerDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) supabase.from('orders').select('*, order_items(*, products(*))').eq('customer_id', user.id).then(({ data }) => setOrders(data || []));
  }, [user]);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-soft-rose">Мои заказы</h1>
      <p className="mb-6">Привет, {profile?.full_name}!</p>
      {orders.length === 0 ? <p>Заказов пока нет</p> : orders.map(order => (
        <div key={order.id} className="card mb-4">
          <div className="flex justify-between">
            <span className="font-semibold">Заказ #{order.id.slice(0,8)}</span>
            <span>{order.status === 'pending' ? 'В обработке' : order.status}</span>
          </div>
          <ul className="mt-2">
            {order.order_items.map(item => (
              <li key={item.id} className="text-sm">{item.products?.title} × {item.quantity} – {item.price} ₽</li>
            ))}
          </ul>
          <p className="font-bold mt-2">Итого: {order.total} ₽</p>
        </div>
      ))}
    </Layout>
  );
}
