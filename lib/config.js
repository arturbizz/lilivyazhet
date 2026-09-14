export const SITE_NAME = 'Лили Вяжет';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const LOGO_URL =
  'https://wzcysenonxyjlksnaezi.supabase.co/storage/v1/object/public/logos/8bfb04f2-3e69-4912-83ca-0d21f122fd28.jfif';

/* Полная ссылка на страницу сайта (для «поделиться» и писем) */
export function absoluteUrl(path = '/') {
  if (typeof window === 'undefined') return BASE_PATH + path;
  return window.location.origin + BASE_PATH + path;
}

export const shopUrl = (slug) => `/master/?s=${encodeURIComponent(slug)}`;
export const productUrl = (id) => `/product/?id=${id}`;

/* Поля товара для карточек */
export const PRODUCT_CARD_SELECT =
  'id,title,price,images,video_url,stock,made_to_order,production_days,in_stock,status,category,seller_id,is_featured,created_at,shop:shops(name,slug,avatar_url,theme)';
