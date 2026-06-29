import Link from 'next/link';
import { useCart } from '../lib/store';
import toast from 'react-hot-toast';

// Иконка-заглушка для товара (клубок)
const YarnPlaceholder = () => (
  <svg className="w-full h-full object-cover rounded-2xl" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="#F7F1E3" />
    <circle cx="150" cy="100" r="50" stroke="#B38B5B" strokeWidth="2" strokeDasharray="4 2" fill="#FDFBF7" />
    <circle cx="150" cy="100" r="15" fill="#E8C4B8" stroke="#B38B5B" strokeWidth="1.5" />
  </svg>
);

export default function ProductCard({ product }) {
  const addItem = useCart((s) => s.addItem);
  const img = product.images?.[0] || '';

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success('Добавлено в корзину!');
  };

  return (
    <div className="card flex flex-col transform hover:-translate-y-1 hover:shadow-2xl">
      <div className="w-full h-56 mb-4 rounded-2xl overflow-hidden">
        {img ? (
          <img src={img} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <YarnPlaceholder />
        )}
      </div>
      <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
      <p className="text-cotton-600 font-bold text-xl mt-auto">
        {product.price} ₽
      </p>
      <div className="flex gap-2 mt-4">
        <Link
          href={`/product/?id=${product.id}`}
          className="btn-secondary text-sm flex-1 text-center py-2"
        >
          Подробнее
        </Link>
        <button onClick={handleAdd} className="btn-primary text-sm flex-1 py-2">
          В корзину
        </button>
      </div>
    </div>
  );
}
