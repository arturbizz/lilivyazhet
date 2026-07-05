import Layout from '../components/Layout';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { useCart } from '../lib/store';
import toast from 'react-hot-toast';

export default function Home() {
  const [products, setProducts] = useState([]);
  const scrollRef = useRef(null);
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .limit(10)
      .then(({ data }) => setProducts(data || []));
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            Лили Вяжет
          </h1>
          <p className="text-gray-500 mb-8">Товары скоро появятся</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-2 text-center">
          Лили{' '}
          <span className="bg-gradient-to-r from-aurora-green via-aurora-blue to-aurora-purple bg-clip-text text-transparent">
            Вяжет
          </span>
        </h1>
        <p className="text-gray-500 text-center mb-8">Авторские игрушки ручной работы</p>

        {/* Скролл-лента */}
        <div className="relative max-w-6xl mx-auto px-4">
          {/* Стрелка влево */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md rounded-full p-2 hidden md:block"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          {/* Лента */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-64 md:w-72 scroll-snap-align-start"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="card group cursor-pointer">
                  <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-50 mb-4">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-aurora-green/10 to-aurora-blue/10">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" strokeDasharray="3 2" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900 mb-1">
                    {product.title}
                  </h3>
                  <p className="text-aurora-green font-bold text-lg mb-3">
                    {product.price} ₽
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/product/?id=${product.id}`)}
                      className="btn-secondary text-xs flex-1 py-1.5"
                    >
                      Подробнее
                    </button>
                    <button
                      onClick={() => {
                        addItem(product);
                        toast.success('Добавлено в корзину');
                      }}
                      className="btn-primary text-xs flex-1 py-1.5"
                    >
                      В корзину
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Стрелка вправо */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md rounded-full p-2 hidden md:block"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Кнопка "Смотреть все" */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/catalog')}
            className="btn-primary text-sm px-6 py-2"
          >
            Смотреть все авторские работы
          </button>
        </div>
      </div>
    </Layout>
  );
}
