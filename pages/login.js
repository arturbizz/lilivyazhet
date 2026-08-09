import Layout from '../components/Layout';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/store';

/* ==================================================
   Фирменные SVG-иконки (без эмодзи)
   ================================================== */
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5" />
    <path d="M12 16.2h.01" />
  </svg>
);

const IconSpark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z" />
  </svg>
);

const IconMail = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3.5 7.5l7.2 5a2 2 0 0 0 2.6 0l7.2-5" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/* Человечные тексты ошибок вместо технических сообщений */
function humanizeError(message = '') {
  if (/already registered/i.test(message)) return 'Этот email уже зарегистрирован — просто войдите.';
  if (/invalid login credentials/i.test(message)) return 'Не удалось войти. Проверьте email и пароль.';
  if (/at least 6 characters/i.test(message)) return 'Пароль должен быть не короче 6 символов.';
  if (/rate limit/i.test(message)) return 'Слишком много попыток. Подождите минуту и повторите.';
  return 'Что-то пошло не так. Попробуйте ещё раз.';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [view, setView] = useState('form');
  const router = useRouter();
  const { setUser, setProfile } = useAuth();

  /* Если профиля ещё нет в БД — создаём его сами (buyer по умолчанию) */
  const ensureProfile = async (user) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) return data;

      const { data: created } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          role: 'buyer',
        })
        .select()
        .single();
      return created || null;
    } catch {
      return null;
    }
  };

  const finishLogin = async (user, welcomeText) => {
    const profile = await ensureProfile(user);
    setUser(user);
    setProfile(profile);
    setStatus({ type: 'success', text: welcomeText });
    setTimeout(() => {
      const role = profile?.role;
      router.push(role === 'admin' ? '/admin' : role === 'master' ? '/dashboard/master' : '/');
    }, 700);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (error) {
        setStatus({ type: 'error', text: humanizeError(error.message) });
      } else if (data?.session) {
        await finishLogin(data.user, 'Добро пожаловать в Лили Вяжет!');
      } else {
        setView('confirm');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (/not confirmed/i.test(error.message)) {
          setView('confirm');
        } else {
          setStatus({ type: 'error', text: humanizeError(error.message) });
        }
      } else {
        await finishLogin(data.user, 'С возвращением!');
      }
    }

    setBusy(false);
  };

  const resendLetter = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setStatus(
      error
        ? { type: 'error', text: 'Не удалось отправить письмо. Попробуйте ещё раз.' }
        : { type: 'info', text: 'Письмо отправлено повторно — проверьте почту.' }
    );
    setBusy(false);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-16 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        {view === 'form' ? (
          <>
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2 text-center">
              {isSignUp ? 'Регистрация' : 'Вход'}
            </h1>
            <p className="text-sm text-gray-400 text-center mb-8">
              {isSignUp ? 'Создайте аккаунт, чтобы заказывать и продавать' : 'Рады видеть вас снова'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green"
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green"
                required
                minLength={6}
              />

              {status && (
                <div
                  className={`animate-fade-in flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
                    status.type === 'error'
                      ? 'border-red-100 bg-red-50/70 text-red-500'
                      : status.type === 'success'
                      ? 'border-aurora-green/20 bg-aurora-green/5 text-aurora-green'
                      : 'border-aurora-blue/20 bg-aurora-blue/5 text-aurora-blue'
                  }`}
                >
                  {status.type === 'error' ? <IconAlert /> : <IconSpark />}
                  <span>{status.text}</span>
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-lg disabled:opacity-60">
                {busy ? <Spinner /> : isSignUp ? 'Создать аккаунт' : 'Войти'}
              </button>
            </form>

            <button
              onClick={() => { setIsSignUp(!isSignUp); setStatus(null); }}
              className="text-aurora-green hover:underline mt-6 w-full text-center text-sm"
            >
              {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-aurora-blue/10 text-aurora-blue flex items-center justify-center mb-6">
              <IconMail />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-3">Проверьте почту</h1>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Мы отправили письмо со ссылкой подтверждения на{' '}
              <span className="font-medium text-gray-700">{email}</span>. Перейдите по ссылке — и мы автоматически откроем ваш кабинет.
            </p>

            {status && (
              <div className="animate-fade-in flex items-center justify-center gap-2.5 rounded-2xl border border-aurora-blue/20 bg-aurora-blue/5 px-4 py-3 text-sm text-aurora-blue mb-6">
                <IconSpark />
                <span>{status.text}</span>
              </div>
            )}

            <button onClick={resendLetter} disabled={busy} className="btn-primary w-full py-3 disabled:opacity-60">
              {busy ? <Spinner /> : 'Отправить письмо ещё раз'}
            </button>
            <button
              onClick={() => { setView('form'); setStatus(null); }}
              className="text-gray-400 hover:text-gray-600 mt-4 w-full text-center text-sm"
            >
              Вернуться ко входу
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
