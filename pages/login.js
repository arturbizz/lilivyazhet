import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();
  const { setUser, setProfile } = useAuth();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(profile);
        if (profile) {
          if (profile.role === 'master') router.push('/dashboard/master');
          else router.push('/');
        } else {
          router.push('/');
        }
      }
    });
    return () => { authListener?.subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        options: { data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else toast.success('Проверьте почту! Мы отправили ссылку для входа.');
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { redirectTo: 'https://arturbizz.github.io/lilivyazhet/auth/callback' },
      });
      if (error) toast.error(error.message);
      else toast.success('Ссылка для входа отправлена на вашу почту!');
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
          <button type="submit" className="btn-primary w-full py-3 text-lg">
            {isSignUp ? 'Зарегистрироваться' : 'Получить ссылку для входа'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="text-aurora-green hover:underline mt-6 w-full text-center text-sm">
          {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </Layout>
  );
}
