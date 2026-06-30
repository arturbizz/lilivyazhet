import Link from 'next/link';
import { useAuth, useCart } from '../lib/store';

const AuroraLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="3 3" fill="white" />
    <circle cx="16" cy="16" r="5" fill="#00E5A0" fillOpacity="0.2" stroke="#00E5A0" strokeWidth="1" />
    <defs>
      <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
        <stop stopColor="#00E5A0" />
        <stop offset="1" stopColor="#00C2FF" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Header() {
  const { user, logout } = useAuth();
  const items = useCart(s => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <AuroraLogo />
          <span className="text-2xl font-heading font-bold text-gray-800 group-hover:text-aurora-green transition-colors">
            ЛилиВяжет
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          <Link href="/catalog" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Каталог
          </Link>
          <Link href="/gift-ideas" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            🎁 Идеи
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
    </header>
  );
}
