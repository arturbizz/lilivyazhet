import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function Welcome() {
  const router = useRouter();

  return (
    <Layout>
      <div className="relative w-full h-[80vh] overflow-hidden">
        {/* Видеофон – выровнен без обрезки (object-contain) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain bg-black"
          src="https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/videos/vkclips_20260630054538.mp4"
        />

        {/* Затемнение для читаемости текста */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Контент поверх видео */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
          {/* Название бренда – прозрачные буквы с обводкой */}
          <h1
            className="text-4xl md:text-6xl font-heading font-bold mb-6 drop-shadow-md"
            style={{
              WebkitTextStroke: '1px rgba(255,255,255,0.9)',
              color: 'transparent',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}
          >
            Лили Вяжет
          </h1>

          {/* Слоган */}
          <p className="text-lg md:text-xl text-white/90 max-w-xl mb-10 drop-shadow">
            Авторские игрушки ручной работы, мастер‑классы и тепло души
          </p>

          {/* Кнопка */}
          <button
            onClick={() => router.push('/catalog')}
            className="btn-primary text-lg px-10 py-4"
          >
            Смотреть авторские работы в наличии
          </button>
        </div>
      </div>
    </Layout>
  );
}
