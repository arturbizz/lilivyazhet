import Layout from '../components/Layout';

export default function GiftIdeas() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-16 text-center">
        <h1 className="text-5xl font-heading font-bold text-gray-900 mb-8">
          Идеи для подарка
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Скоро здесь появится волшебный подборщик подарков, который учтёт возраст, увлечения и настроение!
        </p>
        <div className="mt-12 h-64 rounded-3xl bg-gradient-to-br from-aurora-green/10 to-aurora-blue/10 border border-aurora-green/30 flex items-center justify-center relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 200" fill="none">
            <circle cx="100" cy="100" r="60" stroke="#00E5A0" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="300" cy="100" r="80" stroke="#00C2FF" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="200" cy="100" r="100" stroke="#7B61FF" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <span className="text-6xl">🎀</span>
        </div>
      </div>
    </Layout>
  );
}
