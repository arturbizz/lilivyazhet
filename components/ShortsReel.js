import { useState } from 'react';
import Link from 'next/link';
import { Img, Modal } from './Ui';
import VideoPlayer from './VideoPlayer';
import { IconPlay, IconChevronLeft, IconChevronRight } from './Icons';
import { productUrl, shopUrl } from '../lib/config';
import { rub } from '../lib/format';
import { useHorizontalScroll } from './useHorizontalScroll';

/* Лента вертикальных видео (шортсов) — как в соцсетях */
export default function ShortsReel({ items = [], showShop = false }) {
  const [openIndex, setOpenIndex] = useState(-1);
  const { ref, scroll, canLeft, canRight } = useHorizontalScroll();
  if (!items.length) return null;
  const current = items[openIndex];

  return (
    <>
      <div className="relative -mx-4 sm:mx-0">
        {canLeft && (
          <button onClick={() => scroll('left')} aria-label="Назад"
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 btn-icon w-10 h-10 shadow-md">
            <IconChevronLeft size={18} />
          </button>
        )}
        <div ref={ref} className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-0 pb-2 snap-x snap-mandatory">
          {items.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setOpenIndex(i)}
              className="group relative flex-shrink-0 w-[150px] sm:w-[180px] aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 snap-start"
            >
              {m.poster_url ? (
                <Img src={m.poster_url} alt={m.title || ''} className="absolute inset-0 w-full h-full" imgClassName="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <span className="absolute inset-0 aurora-soft" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                <IconPlay size={16} className="text-gray-900 ml-0.5" />
              </span>
              <span className="absolute bottom-0 left-0 right-0 p-3 text-left">
                {showShop && m.shop?.name && (
                  <span className="block text-[11px] text-white/70 truncate mb-0.5">{m.shop.name}</span>
                )}
                <span className="block text-white text-sm font-medium line-clamp-2 leading-snug">{m.title || 'Смотреть'}</span>
              </span>
            </button>
          ))}
        </div>
        {canRight && (
          <button onClick={() => scroll('right')} aria-label="Вперёд"
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 btn-icon w-10 h-10 shadow-md">
            <IconChevronRight size={18} />
          </button>
        )}
      </div>

      <Modal open={openIndex >= 0} onClose={() => setOpenIndex(-1)} title={current?.title || 'Видео'}>
        {current && (
          <div className="space-y-4">
            <div className="mx-auto max-w-[340px]">
              <VideoPlayer url={current.url} poster={current.poster_url} title={current.title} vertical autoPlay />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {showShop && current.shop?.slug && (
                <Link href={shopUrl(current.shop.slug)} className="btn-secondary text-sm py-2 px-4">
                  Мастерская «{current.shop.name}»
                </Link>
              )}
              {current.product && (
                <Link href={productUrl(current.product.id)} className="btn-primary text-sm py-2 px-5">
                  {current.product.title} · {rub(current.product.price)}
                </Link>
              )}
            </div>
            {items.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button className="btn-secondary text-sm py-2 px-4" disabled={openIndex === 0} onClick={() => setOpenIndex((i) => i - 1)}>
                  <IconChevronLeft size={16} /> Предыдущее
                </button>
                <button className="btn-secondary text-sm py-2 px-4" disabled={openIndex === items.length - 1} onClick={() => setOpenIndex((i) => i + 1)}>
                  Следующее <IconChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
