import Link from 'next/link';
import { Img } from './Ui';
import { shopUrl } from '../lib/config';
import { initials, plural } from '../lib/format';
import { themeGradient } from '../lib/themes';

/* Карточка мастерской для главной и списка мастериц */
export default function ShopTeaser({ shop, productsCount }) {
  return (
    <Link href={shopUrl(shop.slug)} className="card group p-0 overflow-hidden flex flex-col">
      <div className="relative h-28 sm:h-32">
        {shop.cover_url ? (
          <Img src={shop.cover_url} alt="" className="absolute inset-0 w-full h-full"
            imgClassName="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0" style={{ background: themeGradient(shop.theme), opacity: 0.85 }} />
        )}
      </div>
      <div className="px-5 pb-5 -mt-9 relative">
        <div className="aurora-ring w-16 h-16 mb-3" style={{ background: themeGradient(shop.theme) }}>
          <div className="w-full h-full flex items-center justify-center bg-white">
            {shop.avatar_url ? (
              <Img src={shop.avatar_url} alt="" className="w-full h-full" />
            ) : (
              <span className="font-heading font-bold text-gray-400">{initials(shop.name)}</span>
            )}
          </div>
        </div>
        <h3 className="font-heading font-semibold text-gray-900 text-lg leading-snug line-clamp-1">{shop.name}</h3>
        {shop.tagline && <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{shop.tagline}</p>}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          {shop.city && <span>{shop.city}</span>}
          {typeof productsCount === 'number' && (
            <span>{productsCount} {plural(productsCount, ['работа', 'работы', 'работ'])}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
