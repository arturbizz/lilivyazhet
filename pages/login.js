import Layout from '../components/Layout';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();
  const { setUser, setProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) {
        toast.error(error.message);
      } else if (data?.user) {
        toast.success('Аккаунт создан! Сейчас выполним вход…');
        // Автоматический вход после регистрации
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          toast.error('Войдите вручную, используя email и пароль.');
        } else {
          toast.success('Добро пожаловать!');
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error('Неверный email или пароль');
      } else {
        toast.success('Добро пожаловать!');
      }
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
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-aurora-green"
            required
            minLength={6}
          />
          <button type="submit" className="btn-primary w-full py-3 text-lg">
            {isSignUp ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-aurora-green hover:underline mt-6 w-full text-center text-sm"
        >
          {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </Layout>
  );
}
