import Link from 'next/link';
import { useCart } from '../lib/store';
import toast from 'react-hot-toast';

const YarnPlaceholder = () => (
  <svg className="w-full h-full object-cover rounded-xl" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="#F8F9FA" />
    <circle cx="150" cy="100" r="50" stroke="#00E5A0" strokeWidth="1.5" strokeDasharray="4 2" fill="white" />
    <circle cx="150" cy="100" r="12" fill="#00E5A0" fillOpacity="0.3" stroke="#00E5A0" strokeWidth="1" />
  </svg>
);

export default function ProductCard({ product }) {
  const addItem = useCart(s => s.addItem);
  const img = product.images?.[0] || '';

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success('Добавлено в корзину');
  };

  return (
    <div className="card group cursor-pointer">
      <div className="w-full h-56 mb-4 rounded-xl overflow-hidden bg-gray-50">
        {img ? (
          <img src={img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <YarnPlaceholder />
        )}
      </div>
      <h3 className="font-heading font-semibold text-lg text-gray-900 mb-1">{product.title}</h3>
      <p className="text-aurora-green font-bold text-xl mb-4">{product.price} ₽</p>
      <div className="flex gap-2">
        <Link href={`/product/?id=${product.id}`} className="btn-secondary text-sm flex-1 text-center py-2">
          Подробнее
        </Link>
        <button onClick={handleAdd} className="btn-primary text-sm flex-1 py-2">
          В корзину
        </button>
      </div>
    </div>
  );
}
