import { useEffect, useRef, useState } from 'react';
import { parseVideo } from '../lib/video';
import { Img, Placeholder } from './Ui';
import { IconPlay } from './Icons';

/* Проигрыватель: файл из хранилища — через <video>, ссылка — через iframe.
   До нажатия показываем обложку, чтобы страница грузилась быстро. */
export default function VideoPlayer({ url, poster, title = '', vertical = false, autoPlay = false, className = '' }) {
  const info = parseVideo(url);
  const [active, setActive] = useState(autoPlay);
  const videoRef = useRef(null);

  useEffect(() => {
    setActive(autoPlay);
  }, [url, autoPlay]);

  useEffect(() => {
    if (active && info?.type === 'file' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [active, info?.type]);

  const ratio = vertical || info?.vertical ? 'aspect-[9/16]' : 'aspect-video';
  const box = `relative w-full ${ratio} rounded-2xl overflow-hidden bg-gray-900 ${className}`;

  if (!info) {
    return (
      <div className={box}>
        <Placeholder />
      </div>
    );
  }

  if (!active) {
    return (
      <button type="button" onClick={() => setActive(true)} className={`${box} group block`} aria-label={`Смотреть: ${title}`}>
        {poster ? (
          <Img src={poster} alt={title} className="absolute inset-0 w-full h-full" imgClassName="object-cover" />
        ) : (
          <span className="absolute inset-0 aurora-soft" />
        )}
        <span className="absolute inset-0 bg-gray-900/25 group-hover:bg-gray-900/35 transition-colors" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <IconPlay size={26} className="text-gray-900 ml-1" />
          </span>
        </span>
        {title && (
          <span className="absolute bottom-0 left-0 right-0 p-4 text-left text-white text-sm font-medium bg-gradient-to-t from-black/60 to-transparent line-clamp-2">
            {title}
          </span>
        )}
      </button>
    );
  }

  if (info.type === 'file') {
    return (
      <div className={box}>
        <video
          ref={videoRef}
          src={info.src}
          poster={poster || undefined}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      </div>
    );
  }

  return (
    <div className={box}>
      <iframe
        src={`${info.src}${info.src.includes('?') ? '&' : '?'}autoplay=1`}
        title={title || 'Видео'}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
        allowFullScreen
        frameBorder="0"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
