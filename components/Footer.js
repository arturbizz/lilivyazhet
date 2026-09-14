import Link from 'next/link';
import { LOGO_URL, SITE_NAME } from '../lib/config';

const COLUMNS = [
  {
    title: 'Покупателям',
    links: [
      { href: '/catalog/', label: 'Каталог работ' },
      { href: '/masters/', label: 'Мастерицы' },
      { href: '/gift-ideas/', label: 'Идеи для подарка' },
      { href: '/cart/', label: 'Корзина' },
    ],
  },
  {
    title: 'Мастерицам',
    links: [
      { href: '/dashboard/buyer/', label: 'Открыть мастерскую' },
      { href: '/dashboard/master/', label: 'Кабинет мастерицы' },
      { href: '/masterclasses/', label: 'Мастер‑классы' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/80 backdrop-blur-md mt-16">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <img src={LOGO_URL} alt="" className="h-9 w-auto rounded-lg" />
              <span className="text-lg font-heading font-bold">
                <span className="font-light text-yarn">Лили</span> <span className="aurora-text">Вяжет</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
              Площадка, где мастерицы показывают свои работы, а покупатели находят вещи,
              сделанные вручную и с душой.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-heading font-semibold text-gray-800 mb-3 text-sm">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 my-7">
          <span className="accent-line" />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-gray-400 text-xs">
          <span>© {new Date().getFullYear()} {SITE_NAME}. Все права защищены.</span>
          <span>Оплата картой через ЮKassa. Доставку мастерицы отправляют сами.</span>
        </div>
      </div>
    </footer>
  );
}
