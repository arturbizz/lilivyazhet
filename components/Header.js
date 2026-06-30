import Link from 'next/link';
import { useState } from 'react';
import { useAuth, useCart } from '../lib/store';

const AnimatedLogo = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-md"
  >
    {/* Горизонтальные спицы */}
    <g>
      {/* Верхняя спица */}
      <line x1="10" y1="45" x2="110" y2="45" stroke="#B38B5B" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0s" fill="freeze" />
      </line>
      <circle cx="10" cy="45" r="4" fill="#DCC7A3">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0s" fill="freeze" />
      </circle>
      <circle cx="110" cy="45" r="4" fill="#DCC7A3">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0.2s" fill="freeze" />
      </circle>

      {/* Нижняя спица */}
      <line x1="10" y1="75" x2="110" y2="75" stroke="#B38B5B" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0.4s" fill="freeze" />
      </line>
      <circle cx="10" cy="75" r="4" fill="#DCC7A3">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0.4s" fill="freeze" />
      </circle>
      <circle cx="110" cy="75" r="4" fill="#DCC7A3">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0.6s" fill="freeze" />
      </circle>
    </g>

    {/* Вязание: петли между спицами (имитация процесса) */}
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={i}
        d={`M${20 + i * 20},45 Q${30 + i * 20},60 ${20 + i * 20},75`}
        stroke="#00E5A0"
        strokeWidth="2"
        fill="none"
        strokeDasharray="30"
        strokeDashoffset="30"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="30" to="0"
          dur="0.5s"
          begin={`${1.2 + i * 0.3}s`}
          fill="freeze"
        />
      </path>
    ))}

    {/* Исчезновение спиц и петель */}
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="3s" fill="freeze" />

    {/* Мишка (появляется после исчезновения спиц) */}
    <g opacity="0">
      <animate attributeName="opacity" from="0" to="1" dur="1s" begin="4s" fill="freeze" />
      {/* Уши */}
      <circle cx="42" cy="32" r="8" fill="#DCC7A3" />
      <circle cx="78" cy="32" r="8" fill="#DCC7A3" />
      <circle cx="42" cy="32" r="4" fill="#F5D5C6" />
      <circle cx="78" cy="32" r="4" fill="#F5D5C6" />
      {/* Голова */}
      <circle cx="60" cy="48" r="16" fill="#DCC7A3" />
      {/* Мордочка */}
      <ellipse cx="60" cy="54" rx="7" ry="5" fill="#F5D5C6" />
      <circle cx="60" cy="52" r="2" fill="#4A3522" />
      {/* Глаза */}
      <circle cx="53" cy="45" r="2.5" fill="#4A3522" />
      <circle cx="67" cy="45" r="2.5" fill="#4A3522" />
      {/* Тело */}
      <ellipse cx="60" cy="78" rx="18" ry="20" fill="#DCC7A3" />
      {/* Животик */}
      <ellipse cx="60" cy="80" rx="10" ry="12" fill="#F5D5C6" />
      {/* Ручки */}
      <ellipse cx="38" cy="70" rx="8" ry="12" fill="#DCC7A3" transform="rotate(-20, 38, 70)" />
      <ellipse cx="82" cy="70" rx="8" ry="12" fill="#DCC7A3" transform="rotate(20, 82, 70)" />
      {/* Ножки */}
      <ellipse cx="46" cy="98" rx="9" ry="7" fill="#DCC7A3" />
      <ellipse cx="74" cy="98" rx="9" ry="7" fill="#DCC7A3" />
    </g>
  </svg>
);

export default function Header() {
  const { user, logout } = useAuth();
  const items = useCart(s => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        <Link href="/" className="flex items-center gap-3 group">
          <AnimatedLogo />
          <span className="text-xl font-heading font-bold bg-gradient-to-r from-aurora-green to-aurora-purple bg-clip-text text-transparent">
            ЛилиВяжет
          </span>
        </Link>

        <button
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 z-20"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Меню"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/catalog" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Готовые авторские работы
          </Link>
          <Link href="/gift-ideas" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Идеи для подарка
          </Link>
          <Link href="/masterclasses" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Мастер‑классы
          </Link>
          <Link href="/cart" className="relative flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-4 bg-aurora-green text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shadow-lg">
                {totalItems}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link href={user.role === 'seller' ? '/dashboard/seller' : '/dashboard/customer'} className="text-gray-600 hover:text-gray-900 font-medium">
                Кабинет
              </Link>
              <button onClick={logout} className="btn-secondary text-sm py-2 px-5">
                Выйти
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm py-2 px-6">
              Войти
            </Link>
          )}
        </nav>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4">
          <Link href="/catalog" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
            Готовые авторские работы
          </Link>
          <Link href="/gift-ideas" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
            Идеи для подарка
          </Link>
          <Link href="/masterclasses" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
            Мастер‑классы
          </Link>
          <Link href="/cart" className="flex items-center gap-2 text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
            Корзина
            {totalItems > 0 && (
              <span className="bg-aurora-green text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">
                {totalItems}
              </span>
            )}
          </Link>
          <hr className="border-gray-100" />
          {user ? (
            <>
              <Link href={user.role === 'seller' ? '/dashboard/seller' : '/dashboard/customer'} className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
                Кабинет
              </Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="btn-secondary w-full text-center py-2">
                Выйти
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary w-full text-center block py-2" onClick={() => setMenuOpen(false)}>
              Войти
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
