import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function Welcome() {
  const router = useRouter();

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        {/* Логотип */}
        <img
          src="https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/logos/8bfb04f2-3e69-4912-83ca-0d21f122fd28.jfif"
          alt="Лили Вяжет"
          className="w-48 h-48 md:w-64 md:h-64 object-contain mb-8 drop-shadow-xl"
        />

        {/* Название бренда */}
        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
          <span className="text-[#7E5C3A] font-light">Лили</span>{' '}
          <span className="bg-gradient-to-r from-aurora-green via-aurora-blue to-aurora-purple bg-clip-text text-transparent">
            Вяжет
          </span>
        </h1>

        {/* Слоган */}
        <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-10">
          Авторские игрушки ручной работы, мастер‑классы и тепло души
        </p>

        {/* Кнопка перехода – теперь без автоматики */}
        <button
          onClick={() => router.push('/catalog')}
          className="btn-primary text-lg px-10 py-4"
        >
          Смотреть авторские работы в наличии
        </button>
      </div>
    </Layout>
  );
}
