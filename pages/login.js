import Layout from '../components/Layout';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      // Регистрация: просто отправляем ссылку, пароль не нужен
      const { error } = await supabase.auth.signUp({
        email,
        options: { data: { full_name: name, role } },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Проверьте почту! Мы отправили ссылку для входа.');
        setIsSignUp(false);
      }
    } else {
      // Вход: отправляем магическую ссылку
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Ссылка для входа отправлена на вашу почту!');
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
          <button type="submit" className="btn-primary w-full py-3 text-lg">
            {isSignUp
              ? 'Зарегистрироваться'
              : 'Получить ссылку для входа'}
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
