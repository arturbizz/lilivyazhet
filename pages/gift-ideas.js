import Layout from '../components/Layout';

export default function GiftIdeas() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-16 text-center">
        <h1 className="text-5xl font-heading font-bold text-gray-900 mb-8">
          🎂 Идеи подарка на день рождения
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Скоро здесь появится волшебный подборщик подарков, который учтёт возраст, увлечения и даже настроение!
        </p>
        <div className="mt-12 h-64 rounded-3xl bg-gradient-to-br from-aurora-green/10 to-aurora-blue/10 border border-aurora-green/30 flex items-center justify-center">
          <span className="text-6xl">✨</span>
        </div>
      </div>
    </Layout>
  );
}
