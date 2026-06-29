import Link from 'next/link';
import { useAuth, useCart } from '../lib/store';

export default function Header() {
  const { user, logout } = useAuth();
  const items = useCart(s => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="text-2xl font-bold text-soft-rose">ЛилиВяжет</Link>
        <nav className="flex items-center gap-4">
          <Link href="/catalog" className="hover:text-soft-rose">Каталог</Link>
          <Link href="/cart" className="relative">
            🧺 {totalItems > 0 && <span className="absolute -top-2 -right-3 bg-soft-rose text-white rounded-full px-1 text-xs">{totalItems}</span>}
          </Link>
          {user ? (
            <>
              <Link href={user.role === 'seller' ? '/dashboard/seller' : '/dashboard/customer'} className="hover:text-soft-rose">Кабинет</Link>
              <button onClick={logout} className="btn-secondary text-sm py-1 px-3">Выйти</button>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm py-1 px-4">Войти</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
