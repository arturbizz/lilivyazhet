import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCart } from '../lib/store';
import { availability, rub } from '../lib/format';
import { productUrl, shopUrl } from '../lib/config';
import { Img } from './Ui';
import { IconCart, IconVideo, IconCheck } from './Icons';

export default function ProductCard({ product, showShop = true, compact = false }) {
  const addItem = useCart((s) => s.addItem);
  const inCart = useCart((s) => s.items.find((i) => i.id === product.id)?.qty || 0);
  const avail = availability(product);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!avail.ok) return;
    if (addItem(product)) toast.success('Добавлено в корзину');
    else toast('Больше нет в наличии', { icon: '🧶' });
  };

  return (
    <Link href={productUrl(product.id)} className="card group flex flex-col p-4 sm:p-5">
      <div className={`relative w-full ${compact ? 'h-44' : 'h-52 sm:h-56'} mb-4 rounded-xl overflow-hidden bg-gray-50`}>
        <Img
          src={product.images?.[0]}
          alt={product.title}
          className="w-full h-full"
          imgClassName="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.video_url && (
          <span className="absolute top-2.5 left-2.5 badge bg-white/90 text-gray-700 backdrop-blur-sm shadow-sm">
            <IconVideo size={13} /> Видео
          </span>
        )}
        {!avail.ok && (
          <span className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="badge bg-white text-gray-500 shadow-sm border border-gray-100">Нет в наличии</span>
          </span>
        )}
      </div>

      {showShop && product.shop?.slug && (
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = shopUrl(product.shop.slug);
          }}
          className="flex items-center gap-2 mb-2 text-xs text-gray-400 hover:text-gray-700 transition-colors w-fit"
        >
          <span className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            <Img src={product.shop.avatar_url} alt="" className="w-full h-full" />
          </span>
          <span className="truncate max-w-[150px]">{product.shop.name}</span>
        </span>
      )}

      <h3 className="font-heading font-semibold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2 leading-snug">
        {product.title}
      </h3>
      <p className={`text-xs mb-3 ${avail.ok ? 'text-gray-400' : 'text-gray-300'}`}>{avail.label}</p>

      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="font-bold text-lg sm:text-xl aurora-text">{rub(product.price)}</p>
        <button
          onClick={handleAdd}
          disabled={!avail.ok}
          aria-label="Добавить в корзину"
          className={`btn-icon w-10 h-10 ${inCart ? 'text-aurora-green border-aurora-green/40' : ''}`}
        >
          {inCart ? <IconCheck size={18} /> : <IconCart size={18} />}
        </button>
      </div>
    </Link>
  );
}
