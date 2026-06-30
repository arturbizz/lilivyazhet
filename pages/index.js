import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function Welcome() {
  const router = useRouter();

  return (
    <Layout>
      <div className="relative w-full h-screen overflow-hidden">
        {/* Видеофон – заполняет всё, акцент по центру */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
          src="https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/videos/vkclips_20260630054538.mp4"
        />

        {/* Мягкое затемнение */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Контент – смещён вниз, большие отступы */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-28 md:pb-36 px-6">
          <div className="max-w-2xl mx-auto text-center">
            {/* Заголовок – чистый белый с глубокой тенью */}
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
              Лили{' '}
              <span className="bg-gradient-to-r from-aurora-green via-aurora-blue to-aurora-purple bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                Вяжет
              </span>
            </h1>

            {/* Слоган */}
            <p className="text-base md:text-xl text-white/90 max-w-xl mx-auto mb-10 drop-shadow-md">
              Авторские игрушки ручной работы, мастер‑классы и тепло души
            </p>

            {/* Кнопка – тонкая, компактная, с отступом */}
            <button
              onClick={() => router.push('/catalog')}
              className="btn-primary text-sm md:text-base px-6 py-2.5 inline-block"
            >
              Смотреть авторские работы в наличии
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
