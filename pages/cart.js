import Layout from '../components/Layout';
import { useCart, useAuth } from '../lib/store';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();

  const handleOrder = async () => {
    if (!user) return toast.error('Войдите, чтобы оформить заказ');
    const { data: order } = await supabase
      .from('orders')
      .insert({ customer_id: user.id, total: total(), status: 'pending' })
      .select()
      .single();
    if (order) {
      const itemsData = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        quantity: i.qty,
        price: i.price,
      }));
      await supabase.from('order_items').insert(itemsData);
      clearCart();
      toast.success('Заказ оформлен! Спасибо ❤️');
    }
  };

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-soft-rose mb-8">Корзина</h1>
      {items.length === 0 ? (
        <p className="text-center text-soft-chocolate">Ваша корзина пуста</p>
      ) : (
        <div className="space-y-6">
          {items.map((i) => (
            <div
              key={i.id}
              className="flex items-center gap-6 bg-white p-5 rounded-2xl shadow-md"
            >
              <img
                src={i.images?.[0] || 'https://via.placeholder.com/80/F9A8D4/FFF?text=🧸'}
                className="w-20 h-20 object-cover rounded-xl"
              />
              <div className="flex-grow">
                <h3 className="font-semibold text-lg">{i.title}</h3>
                <p className="text-soft-rose font-bold">
                  {i.price} ₽ × {i.qty}
                </p>
              </div>
              <button
                onClick={() => removeItem(i.id)}
                className="text-red-400 hover:text-red-600 font-medium"
              >
                Удалить
              </button>
            </div>
          ))}
          <div className="text-2xl font-bold text-right mt-6">
            Итого: {total()} ₽
          </div>
          <button onClick={handleOrder} className="btn-primary w-full mt-4 text-lg py-4">
            Оформить заказ
          </button>
        </div>
      )}
    </Layout>
  );
}
