import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('customer');
  const router = useRouter();
  const { setUser, setProfile } = useAuth();

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
      const { error } = await supabase.auth.signUp({
        email,
        password: 'temp-password-123',
        options: { data: { full_name: name, role } },
      });
      if (error) toast.error(error.message);
      else toast.success('Регистрация! Проверьте почту.');
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) toast.error(error.message);
      else toast.success('Ссылка отправлена на почту!');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-16 bg-white p-10 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold text-soft-rose mb-6 text-center">
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
                className="border-2 w-full px-4 py-3 rounded-full focus:outline-none focus:border-soft-rose"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border-2 w-full px-4 py-3 rounded-full focus:outline-none focus:border-soft-rose"
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
            className="border-2 w-full px-4 py-3 rounded-full focus:outline-none focus:border-soft-rose"
            required
          />
          <button type="submit" className="btn-primary w-full py-3 text-lg">
            {isSignUp ? 'Зарегистрироваться' : 'Получить ссылку на вход'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-soft-rose underline mt-6 w-full text-center"
        >
          {isSignUp
            ? 'Уже есть аккаунт? Войти'
            : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </Layout>
  );
}
