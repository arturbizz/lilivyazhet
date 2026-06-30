import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/store';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [masterclasses, setMasterclasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверка: только админ имеет доступ
    if (profile && profile.role !== 'admin') {
      router.push('/');
      toast.error('Доступ запрещён');
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadData();
    }
  }, [profile, tab]);

  const loadData = async () => {
    setLoading(true);
    switch (tab) {
      case 'users':
        const { data: usersData } = await supabase.from('profiles').select('*');
        setUsers(usersData || []);
        break;
      case 'orders':
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, order_items(*, products(*))');
        setOrders(ordersData || []);
        break;
      case 'products':
        const { data: productsData } = await supabase.from('products').select('*, profiles(full_name)');
        setProducts(productsData || []);
        break;
      case 'masterclasses':
        const { data: masterclassesData } = await supabase.from('masterclasses').select('*, profiles(full_name)');
        setMasterclasses(masterclassesData || []);
        break;
    }
    setLoading(false);
  };

  const deleteItem = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) toast.error('Ошибка удаления');
    else {
      toast.success('Удалено');
      loadData();
    }
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <Layout>
        <p className="text-center py-20 text-gray-500">Проверка доступа...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-10 px-4">
        <h1 className="text-4xl font-heading font-bold text-gray-900 mb-8">
          🛡️ Панель администратора
        </h1>

        {/* Вкладки */}
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            { key: 'users', label: '👥 Пользователи' },
            { key: 'orders', label: '📦 Заказы' },
            { key: 'products', label: '🧸 Товары' },
            { key: 'masterclasses', label: '🎬 Мастер‑классы' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                tab === t.key
                  ? 'border-aurora-green bg-aurora-green/5 text-aurora-green shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Загрузка...</p>
        ) : (
          <>
            {/* Пользователи */}
            {tab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Имя</th>
                      <th className="py-3 px-4">Роль</th>
                      <th className="py-3 px-4">Дата регистрации</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{u.email || '—'}</td>
                        <td className="py-3 px-4">{u.full_name || '—'}</td>
                        <td className="py-3 px-4 capitalize">{u.role}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Заказы */}
            {tab === 'orders' && (
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <p className="text-gray-500">Нет заказов</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="card">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold">Заказ #{order.id.slice(0, 8)}</span>
                        <span className="text-sm text-gray-400">
                          {order.status === 'pending' ? 'В обработке' : order.status}
                        </span>
                      </div>
                      <ul className="text-sm space-y-1">
                        {order.order_items?.map((item) => (
                          <li key={item.id}>
                            {item.products?.title || 'Товар'} × {item.quantity} — {item.price} ₽
                          </li>
                        ))}
                      </ul>
                      <p className="font-bold mt-2">Итого: {order.total} ₽</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Товары */}
            {tab === 'products' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="card flex flex-col">
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-aurora-green font-bold">{p.price} ₽</p>
                    <p className="text-sm text-gray-500">Продавец: {p.profiles?.full_name || '—'}</p>
                    <button
                      onClick={() => deleteItem('products', p.id)}
                      className="mt-auto text-xs text-red-400 hover:text-red-600 self-end"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Мастер‑классы */}
            {tab === 'masterclasses' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {masterclasses.map((mc) => (
                  <div key={mc.id} className="card flex flex-col">
                    <h3 className="font-semibold">{mc.title}</h3>
                    {mc.price > 0 && <p className="text-aurora-green font-bold">{mc.price} ₽</p>}
                    <p className="text-sm text-gray-500">Автор: {mc.profiles?.full_name || '—'}</p>
                    <button
                      onClick={() => deleteItem('masterclasses', mc.id)}
                      className="mt-auto text-xs text-red-400 hover:text-red-600 self-end"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
