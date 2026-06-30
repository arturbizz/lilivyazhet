import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function Welcome() {
  const router = useRouter();

  return (
    <Layout>
      {/* Hero-блок во весь экран */}
      <div className="relative w-full h-screen overflow-hidden">
        {/* Видеофон – заполняет всё без полос */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/videos/vkclips_20260630054538.mp4"
        />

        {/* Мягкое затемнение по всей поверхности */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Контент – смещён вниз, аккуратные отступы */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-16 md:pb-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            {/* Прозрачный заголовок с обводкой + лёгкая тень */}
            <h1
              className="text-5xl md:text-7xl font-heading font-bold mb-6 tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
              style={{
                WebkitTextStroke: '1px rgba(255,255,255,0.8)',
                color: 'transparent',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              Лили Вяжет
            </h1>

            {/* Слоган */}
            <p className="text-base md:text-xl text-white/90 max-w-xl mx-auto mb-8 drop-shadow-md">
              Авторские игрушки ручной работы, мастер‑классы и тепло души
            </p>

            {/* Кнопка */}
            <button
              onClick={() => router.push('/catalog')}
              className="btn-primary text-base md:text-lg px-8 py-3"
            >
              Смотреть авторские работы в наличии
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
