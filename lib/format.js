const rubFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
export const rub = (n) => `${rubFmt.format(Number(n) || 0)} ₽`;

export function plural(n, forms) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function dateRu(iso, withTime = false) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(
    'ru-RU',
    withTime
      ? { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'long', year: 'numeric' }
  );
}

export const ORDER_STATUS = {
  pending: { label: 'Ждёт оплаты', cls: 'bg-amber-50 text-amber-600 border border-amber-100' },
  paid: { label: 'Оплачен', cls: 'bg-sky-50 text-sky-600 border border-sky-100' },
  shipped: { label: 'Отправлен', cls: 'bg-violet-50 text-violet-600 border border-violet-100' },
  completed: { label: 'Получен', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  cancelled: { label: 'Отменён', cls: 'bg-gray-50 text-gray-400 border border-gray-100' },
};

/* Наличие товара человеческими словами */
export function availability(p) {
  if (!p) return { ok: false, label: '' };
  if (p.made_to_order) {
    const d = p.production_days;
    return { ok: true, label: d ? `Под заказ · ${d} ${plural(d, ['день', 'дня', 'дней'])}` : 'Под заказ' };
  }
  const s = Number(p.stock ?? 0);
  if (s <= 0) return { ok: false, label: 'Нет в наличии' };
  if (s === 1) return { ok: true, label: 'Последний экземпляр' };
  return { ok: true, label: `В наличии: ${s} шт.` };
}

export const maxQty = (p) => (p?.made_to_order ? 99 : Math.max(0, Math.min(99, Number(p?.stock ?? 0))));

/* Транслитерация для адреса страницы: «Лилины игрушки» → lininy-igrushki */
const TR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .split('')
    .map((ch) => (TR[ch] !== undefined ? TR[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export const initials = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
