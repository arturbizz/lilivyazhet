import Layout from '../components/Layout';

export default function Masterclasses() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-16">
        <h1 className="text-5xl font-heading font-bold text-gray-900 mb-8 text-center">
          🧶 Мастер‑классы
        </h1>
        <p className="text-xl text-gray-600 text-center mb-16">
          Готовые видеоуроки и пошаговые инструкции от лучших мастеров
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {['Вязаный зайка', 'Миниатюрный мишка', 'Кукла Тильда', 'Амигуруми для начинающих'].map((title, i) => (
            <div key={i} className="card flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-aurora-green/20 to-aurora-blue/20 flex items-center justify-center text-3xl">
                🎬
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">{title}</h3>
                <p className="text-gray-500 text-sm mt-1">Скоро в продаже</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
