import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function Welcome() {
  const router = useRouter();

  return (
    <Layout>
      <div className="relative w-full h-[80vh] overflow-hidden">
        {/* Видеофон */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/videos/vkclips_20260630054538.mp4"
        />

        {/* Затемнение для читаемости текста */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Контент поверх видео */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
          {/* Логотип */}
          <img
            src="https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/logos/8bfb04f2-3e69-4912-83ca-0d21f122fd28.jfif"
            alt="Лили Вяжет"
            className="w-32 h-32 md:w-40 md:h-40 object-contain mb-6 drop-shadow-lg"
          />

          {/* Название бренда */}
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4 text-white drop-shadow-md">
            <span className="font-light text-[#F5D5C6]">Лили</span>{' '}
            <span className="bg-gradient-to-r from-aurora-green via-aurora-blue to-aurora-purple bg-clip-text text-transparent">
              Вяжет
            </span>
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
