import Link from 'next/link';
import { useCart } from '../lib/store';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCart((s) => s.addItem);
  const img = product.images?.[0] || 'https://via.placeholder.com/300x200/F9A8D4/FFF?text=🧸';

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success('Добавлено в корзину!');
  };

  return (
    <div className="card flex flex-col transform hover:-translate-y-1 hover:shadow-2xl">
      <img
        src={img}
        alt={product.title}
        className="w-full h-56 object-cover rounded-2xl mb-4"
      />
      <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
      <p className="text-soft-rose font-bold text-xl mt-auto">
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
