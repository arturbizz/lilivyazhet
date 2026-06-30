import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('customer');
  const router = useRouter();
  const { setUser, setProfile } = useAuth();

  // Слушаем изменения авторизации
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profile);
          router.push('/');
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      // Регистрация
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role } },
      });
      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }
      // Автоматический вход сразу после регистрации
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        toast.error('Регистрация прошла, но не удалось войти. Попробуйте войти вручную.');
        setIsSignUp(false);
      } else {
        toast.success('Добро пожаловать!');
        // Редирект произойдёт в onAuthStateChange
      }
    } else {
      // Вход
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) toast.error(error.message);
      else toast.success('Добро пожаловать!');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-16 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8 text-center">
          {isSignUp ? 'Регистрация' : 'Вход'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green"
              >
                <option value="customer">Я покупатель</option>
                <option value="seller">Я мастер</option>
              </select>
            </>
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
          />
          <button type="submit" className="btn-primary w-full py-3 text-lg">
            {isSignUp ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-aurora-green hover:underline mt-6 w-full text-center text-sm"
        >
          {isSignUp
            ? 'Уже есть аккаунт? Войти'
            : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </Layout>
  );
}
