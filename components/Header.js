import Link from 'next/link';
import { useState } from 'react';
import { useAuth, useCart } from '../lib/store';

// Анимированный логотип: спицы + нить → мишка
const AnimatedLogo = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-sm"
  >
    {/* Спица левая */}
    <g transform="translate(10, 10)">
      <line
        x1="20" y1="0" x2="20" y2="70"
        stroke="#B38B5B" strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="0" r="3" fill="#DCC7A3" />
    </g>

    {/* Спица правая */}
    <g transform="translate(70, 10)">
      <line
        x1="0" y1="0" x2="0" y2="70"
        stroke="#B38B5B" strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="0" cy="0" r="3" fill="#DCC7A3" />
    </g>

    {/* Нить */}
    <path
      d="M30,15 Q50,30 30,45 Q10,60 30,75 Q50,90 70,75"
      stroke="#00E5A0"
      strokeWidth="2"
      strokeDasharray="80"
      strokeDashoffset="80"
      fill="none"
      strokeLinecap="round"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="80" to="0"
        dur="2s"
        begin="0s"
        fill="freeze"
      />
    </path>

    {/* Мишка (появляется после анимации нити) */}
    <g opacity="0">
      <animate
        attributeName="opacity"
        from="0" to="1"
        dur="1s"
        begin="2.5s"
        fill="freeze"
      />
      {/* Тело мишки */}
      <circle cx="50" cy="60" r="12" fill="#C7A87B" />
      {/* Голова */}
      <circle cx="50" cy="45" r="8" fill="#C7A87B" />
      {/* Уши */}
      <circle cx="43" cy="38" r="4" fill="#C7A87B" />
      <circle cx="57" cy="38" r="4" fill="#C7A87B" />
      <circle cx="43" cy="38" r="2" fill="#F5D5C6" />
      <circle cx="57" cy="38" r="2" fill="#F5D5C6" />
      {/* Глаза и нос */}
      <circle cx="47" cy="44" r="1.5" fill="#4A3522" />
      <circle cx="53" cy="44" r="1.5" fill="#4A3522" />
      <circle cx="50" cy="48" r="1.5" fill="#4A3522" />
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
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-3 group">
          <AnimatedLogo />
          <span className="text-xl font-heading font-bold bg-gradient-to-r from-aurora-green to-aurora-purple bg-clip-text text-transparent">
            ЛилиВяжет
          </span>
        </Link>

        {/* Гамбургер-кнопка (только на мобильных) */}
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

        {/* Навигация (десктоп) */}
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

      {/* Мобильное меню (выпадашка) */}
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
