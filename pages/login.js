import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { supabase, humanError } from '../lib/supabase';
import { useAuth } from '../lib/store';
import { Notice } from '../components/Ui';
import { IconMail, Spinner } from '../components/Icons';
import { absoluteUrl } from '../lib/config';

function loginError(message = '') {
  if (/already registered/i.test(message)) return 'Этот адрес уже зарегистрирован — просто войдите.';
  if (/invalid login credentials/i.test(message)) return 'Не удалось войти. Проверьте почту и пароль.';
  if (/at least 6 characters|password should be/i.test(message)) return 'Пароль должен быть не короче 6 символов.';
  if (/rate limit|too many/i.test(message)) return 'Слишком много попыток. Подождите минуту и повторите.';
  if (/email address.*invalid/i.test(message)) return 'Проверьте, правильно ли написан адрес почты.';
  return humanError({ message });
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
  const { user, profile, shop, ready, loadAccount } = useAuth();

  const next = typeof router.query.next === 'string' ? router.query.next : '';

  useEffect(() => {
    if (!ready || !user || !profile) return;
    const target = next || (profile.role === 'admin' ? '/admin/' : shop ? '/dashboard/master/' : '/');
    router.replace(target);
  }, [ready, user, profile, shop, next, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() }, emailRedirectTo: absoluteUrl('/auth/callback/') },
      });
      if (error) setStatus({ type: 'error', text: loginError(error.message) });
      else if (data?.session) {
        await loadAccount(data.user);
        setStatus({ type: 'success', text: 'Добро пожаловать в Лили Вяжет!' });
      } else setView('confirm');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (/not confirmed/i.test(error.message)) setView('confirm');
        else setStatus({ type: 'error', text: loginError(error.message) });
      } else {
        await loadAccount(data.user);
        setStatus({ type: 'success', text: 'С возвращением!' });
      }
    }
    setBusy(false);
  };

  const resendLetter = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: absoluteUrl('/auth/callback/') },
    });
    setStatus(
      error
        ? { type: 'error', text: 'Не удалось отправить письмо. Попробуйте через минуту.' }
        : { type: 'info', text: 'Письмо отправлено повторно — проверьте почту.' }
    );
    setBusy(false);
  };

  return (
    <Layout title={isSignUp ? 'Регистрация' : 'Вход'}>
      <div className="max-w-md mx-auto mt-6 sm:mt-14 panel p-8 sm:p-10 animate-fade-in">
        {view === 'form' ? (
          <>
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2 text-center">
              {isSignUp ? 'Регистрация' : 'Вход'}
            </h1>
            <p className="text-sm text-gray-400 text-center mb-8">
              {isSignUp ? 'Создайте аккаунт, чтобы заказывать и продавать' : 'Рады видеть вас снова'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <input type="text" placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)}
                  className="input" required autoComplete="name" />
              )}
              <input type="email" placeholder="Электронная почта" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" required autoComplete="email" />
              <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" required minLength={6} autoComplete={isSignUp ? 'new-password' : 'current-password'} />

              {status && <Notice type={status.type}>{status.text}</Notice>}

              <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
                {busy ? <Spinner /> : isSignUp ? 'Создать аккаунт' : 'Войти'}
              </button>
            </form>

            <button onClick={() => { setIsSignUp(!isSignUp); setStatus(null); }}
              className="text-aurora-green hover:underline mt-6 w-full text-center text-sm">
              {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
            {isSignUp && (
              <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
                Регистрируясь, вы соглашаетесь с правилами площадки и обработкой ваших данных для оформления заказов.
              </p>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-aurora-blue/10 text-aurora-blue flex items-center justify-center mb-6">
              <IconMail size={28} />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-3">Проверьте почту</h1>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Мы отправили письмо со ссылкой подтверждения на{' '}
              <span className="font-medium text-gray-700">{email}</span>. Перейдите по ссылке — и мы откроем ваш кабинет.
            </p>
            {status && <div className="mb-6"><Notice type={status.type}>{status.text}</Notice></div>}
            <button onClick={resendLetter} disabled={busy} className="btn-primary w-full py-3">
              {busy ? <Spinner /> : 'Отправить письмо ещё раз'}
            </button>
            <button onClick={() => { setView('form'); setStatus(null); }}
              className="text-gray-400 hover:text-gray-600 mt-4 w-full text-center text-sm">
              Вернуться ко входу
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
