import Link from 'next/link';
import { useAuth, useCart } from '../lib/store';

// Иконка клубка ниток (SVG)
const YarnIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#B38B5B" strokeWidth="1.5" strokeDasharray="3 2" fill="#FDFBF7" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" stroke="#B38B5B" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" fill="#E8C4B8" stroke="#B38B5B" strokeWidth="1" />
  </svg>
);

export default function Header() {
  const { user, logout } = useAuth();
  const items = useCart((s) => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-cotton-200 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center gap-2 group">
          <YarnIcon className="w-8 h-8" />
          <span className="text-2xl font-display font-semibold text-cotton-700 group-hover:text-thread-rose transition-colors">
            ЛилиВяжет
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/catalog" className="text-cotton-600 hover:text-cotton-800 font-medium">
            Каталог
          </Link>
          <Link href="/cart" className="relative flex items-center gap-1 text-cotton-600 hover:text-cotton-800">
            <YarnIcon className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-cotton-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {totalItems}
              </span>
            )}
            <span className="hidden sm:inline">Корзина</span>
          </Link>
          {user ? (
            <>
              <Link
                href={user.role === 'seller' ? '/dashboard/seller' : '/dashboard/customer'}
                className="text-cotton-600 hover:text-cotton-800 font-medium"
              >
                Кабинет
              </Link>
              <button onClick={logout} className="btn-secondary text-sm py-1 px-4">
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
    </header>
  );
}
