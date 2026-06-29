import Link from 'next/link';
import { useCart } from '../lib/store';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCart(s => s.addItem);
  const img = product.images?.[0] || '/placeholder.png';

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success('Добавлено в корзину!');
  };

  return (
    <div className="card flex flex-col">
      <img src={img} alt={product.title} className="w-full h-48 object-cover rounded-2xl mb-3" />
      <h3 className="font-semibold text-lg">{product.title}</h3>
      <p className="text-soft-rose font-bold mt-auto">{product.price} ₽</p>
      <div className="flex gap-2 mt-3">
        <Link href={`/product?id=${product.id}`} className="btn-secondary text-sm flex-1 text-center py-1">Подробнее</Link>
        <button onClick={handleAdd} className="btn-primary text-sm flex-1 py-1">В корзину</button>
      </div>
    </div>
  );
}
