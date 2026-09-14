import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/* Человечные тексты ошибок вместо технических сообщений */
export function humanError(error, fallback = 'Что-то пошло не так. Попробуйте ещё раз.') {
  const msg = error?.message || String(error || '');
  if (!msg) return fallback;
  if (/shops_slug_key|duplicate key.*slug/i.test(msg)) return 'Такой адрес страницы уже занят — придумайте другой.';
  if (/shops_slug_format/i.test(msg)) return 'Адрес страницы: от 3 до 40 символов — латиница, цифры и дефис.';
  if (/one_pending/i.test(msg)) return 'Ваша заявка уже на рассмотрении.';
  if (/row-level security|permission denied/i.test(msg)) return 'Недостаточно прав для этого действия.';
  if (/JWT|not authenticated/i.test(msg)) return 'Войдите в аккаунт и попробуйте снова.';
  if (/too large|maximum allowed size|exceeded/i.test(msg)) return 'Файл слишком большой — максимум 50 МБ.';
  if (/mime type|invalid_mime/i.test(msg)) return 'Такой формат файла не поддерживается.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Нет связи с сервером. Проверьте интернет.';
  if (/[а-яё]/i.test(msg)) return msg; // наши русские сообщения из базы
  return fallback;
}
