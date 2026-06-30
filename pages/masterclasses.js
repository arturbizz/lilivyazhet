import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

export default function Masterclasses() {
  const [masterclasses, setMasterclasses] = useState([]);

  useEffect(() => {
    supabase
      .from('masterclasses')
      .select('*')
      .then(({ data }) => setMasterclasses(data || []));
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-16">
        <h1 className="text-5xl font-heading font-bold text-gray-900 mb-8 text-center">
          Мастер‑классы
        </h1>
        {masterclasses.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            Пока нет мастер‑классов. Станьте первым мастером и добавьте свой!
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {masterclasses.map((mc) => (
              <div key={mc.id} className="card flex items-center gap-6">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-aurora-green/20 to-aurora-blue/20 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="2 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">{mc.title}</h3>
                  {mc.description && <p className="text-gray-500 text-sm mt-1">{mc.description}</p>}
                  {mc.price > 0 && <p className="text-aurora-green font-bold mt-1">{mc.price} ₽</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
