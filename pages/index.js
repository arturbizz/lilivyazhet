import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function Welcome() {
  const router = useRouter();

  return (
    <Layout>
      <div className="relative w-full h-dvh overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/videos/vkclips_20260630054538.mp4"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Контент в нижней половине экрана, но не в самом низу */}
        <div className="absolute inset-x-0 bottom-12 md:bottom-20 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4 drop-shadow-lg">
              Лили{' '}
              <span className="bg-gradient-to-r from-aurora-green via-aurora-blue to-aurora-purple bg-clip-text text-transparent">
                Вяжет
              </span>
            </h1>
            <p className="text-sm md:text-lg text-white/90 mb-6 max-w-sm mx-auto drop-shadow">
              Авторские игрушки ручной работы, мастер‑классы и тепло души
            </p>
            <button
              onClick={() => router.push('/catalog')}
              className="btn-primary text-xs md:text-sm px-4 py-1.5"
            >
              Смотреть авторские работы в наличии
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
