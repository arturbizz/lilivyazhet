import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth, useCart, useCartHydrated } from '../lib/store';
import { LOGO_URL } from '../lib/config';
import { IconCart, IconClose, IconLogout, IconMenu, IconSearch, IconStore, IconUser } from './Icons';

const NAV = [
  { href: '/catalog/', label: 'Каталог' },
  { href: '/masters/', label: 'Мастерицы' },
  { href: '/masterclasses/', label: 'Мастер‑классы' },
  { href: '/gift-ideas/', label: 'Идеи для подарка' },
];

export default function Header() {
  const { user, profile, shop, logout } = useAuth();
  const items = useCart((s) => s.items);
  const hydrated = useCartHydrated();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const totalItems = hydrated ? items.reduce((sum, i) => sum + i.qty, 0) : 0;

  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on('routeChangeComplete', close);
    return () => router.events.off('routeChangeComplete', close);
  }, [router.events]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const search = (e) => {
    e.preventDefault();
    router.push(query.trim() ? `/catalog/?q=${encodeURIComponent(query.trim())}` : '/catalog/');
    setMenuOpen(false);
  };

  const isActive = (href) => router.pathname === href.replace(/\/$/, '') || router.asPath.startsWith(href);
  const cabinetHref = profile?.role === 'admin' ? '/admin/' : shop ? '/dashboard/master/' : '/dashboard/buyer/';
  const cabinetLabel = profile?.role === 'admin' ? 'Админ‑панель' : shop ? 'Моя мастерская' : 'Мой кабинет';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src={LOGO_URL} alt="Лили Вяжет" className="h-9 md:h-11 w-auto object-contain rounded-lg" />
          <span className="text-lg md:text-xl font-heading font-bold whitespace-nowrap">
            <span className="font-light text-yarn">Лили</span>{' '}
            <span className="aurora-text">Вяжет</span>
          </span>
        </Link>

        <form onSubmit={search} className="hidden lg:flex items-center flex-1 max-w-xs ml-4 relative">
          <IconSearch size={17} className="absolute left-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти работу"
            aria-label="Поиск по каталогу"
            className="input py-2 pl-11 text-sm"
          />
        </form>

        <nav className="hidden md:flex items-center gap-5 ml-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`font-medium transition-colors text-sm whitespace-nowrap ${
                isActive(n.href) ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {n.label}
            </Link>
          ))}

          <Link href="/cart/" className="relative flex items-center text-gray-600 hover:text-gray-900 px-1" aria-label="Корзина">
            <IconCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-aurora-green text-white min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[11px] font-bold shadow">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href={cabinetHref} className="btn-secondary text-sm py-2 px-4">
                {shop ? <IconStore size={16} /> : <IconUser size={16} />}
                <span className="hidden lg:inline">{cabinetLabel}</span>
              </Link>
              {profile?.role === 'admin' && shop && (
                <Link href="/dashboard/master/" className="btn-icon" aria-label="Моя мастерская" title="Моя мастерская">
                  <IconStore size={17} />
                </Link>
              )}
              <button onClick={logout} className="btn-icon" aria-label="Выйти" title="Выйти">
                <IconLogout size={17} />
              </button>
            </div>
          ) : (
            <Link href="/login/" className="btn-primary text-sm py-2 px-5">Войти</Link>
          )}
        </nav>

        <div className="flex items-center gap-1 ml-auto md:hidden">
          <Link href="/cart/" className="relative btn-icon" aria-label="Корзина">
            <IconCart size={19} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-aurora-green text-white min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold">
                {totalItems}
              </span>
            )}
          </Link>
          <button className="btn-icon" onClick={() => setMenuOpen((v) => !v)} aria-label="Меню">
            {menuOpen ? <IconClose size={19} /> : <IconMenu size={19} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 animate-fade-in max-h-[calc(100vh-64px)] overflow-y-auto">
          <form onSubmit={search} className="relative mb-3">
            <IconSearch size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти работу" className="input pl-11" />
          </form>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block text-gray-700 font-medium py-2.5 px-2 rounded-xl hover:bg-gray-50">
              {n.label}
            </Link>
          ))}
          <hr className="border-gray-100 my-2" />
          {user ? (
            <>
              <Link href={cabinetHref} className="block text-gray-700 font-medium py-2.5 px-2 rounded-xl hover:bg-gray-50">
                {cabinetLabel}
              </Link>
              {profile?.role === 'admin' && shop && (
                <Link href="/dashboard/master/" className="block text-gray-700 font-medium py-2.5 px-2 rounded-xl hover:bg-gray-50">
                  Моя мастерская
                </Link>
              )}
              <button onClick={logout} className="btn-secondary w-full mt-2 py-2.5">
                <IconLogout size={16} /> Выйти
              </button>
            </>
          ) : (
            <Link href="/login/" className="btn-primary w-full mt-2 py-2.5">Войти</Link>
          )}
        </div>
      )}
    </header>
  );
}
