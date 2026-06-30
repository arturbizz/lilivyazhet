import Layout from '../components/Layout';
import { useCart, useAuth } from '../lib/store';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function Cart() {
  const { items, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleOrder = async () => {
    if (!user) {
      toast.error('Войдите, чтобы оформить заказ');
      router.push('/login');
      return;
    }
    const { data: order, error } = await supabase.from('orders').insert({
      customer_id: user.id,
      total: total(),
      status: 'pending',
    }).select().single();
    if (error) return toast.error(error.message);
    const itemsData = items.map(i => ({
      order_id: order.id,
      product_id: i.id,
      quantity: i.qty,
      price: i.price,
    }));
    await supabase.from('order_items').insert(itemsData);
    clearCart();
    toast.success('Заказ оформлен! Спасибо ❤️');
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-soft-rose mb-6">Корзина</h1>
      {items.length === 0 ? <p>Ваша корзина пуста</p> : (
        <div className="space-y-4">
          {items.map(i => (
            <div key={i.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow">
              <img src={i.images?.[0] || '/placeholder.png'} className="w-16 h-16 object-cover rounded-xl" alt="" />
              <div className="flex-grow">
                <h3 className="font-semibold">{i.title}</h3>
                <p>{i.price} ₽ × {i.qty}</p>
              </div>
              <button onClick={() => removeItem(i.id)} className="text-red-400">Удалить</button>
            </div>
          ))}
          <div className="text-xl font-bold mt-4">Итого: {total()} ₽</div>
          <button onClick={handleOrder} className="btn-primary mt-4">Оформить заказ</button>
        </div>
      )}
    </Layout>
  );
}
