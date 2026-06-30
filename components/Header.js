import Link from 'next/link';
import { useState } from 'react';
import { useAuth, useCart } from '../lib/store';

export default function Header() {
  const { user, logout } = useAuth();
  const items = useCart(s => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-2">
        {/* Логотип + название */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <img
            src="https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/logos/8bfb04f2-3e69-4912-83ca-0d21f122fd28.jfif"
            alt="Лили Вяжет"
            className="h-10 md:h-12 w-auto object-contain"
          />
          <span className="text-xl font-heading font-bold whitespace-nowrap">
            <span className="font-light text-[#7E5C3A]">Лили</span>{' '}
            <span className="bg-gradient-to-r from-aurora-green via-aurora-blue to-aurora-purple bg-clip-text text-transparent">
              Вяжет
            </span>
          </span>
        </Link>

        {/* Гамбургер (мобильные) */}
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
        <nav className="hidden md:flex items-center gap-6 ml-auto">
          <Link href="/catalog" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm lg:text-base">
            Авторские работы в наличии
          </Link>
          <Link href="/gift-ideas" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm lg:text-base">
            Идеи для подарка
          </Link>
          <Link href="/masterclasses" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm lg:text-base">
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
              <Link href={user.role === 'seller' ? '/dashboard/seller' : '/dashboard/customer'} className="text-gray-600 hover:text-gray-900 font-medium text-sm lg:text-base">
                Кабинет
              </Link>
              <button onClick={logout} className="btn-secondary text-sm py-2 px-4">
                Выйти
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm py-2 px-5">
              Войти
            </Link>
          )}
        </nav>
      </div>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4">
          <Link href="/catalog" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
            Авторские работы в наличии
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
