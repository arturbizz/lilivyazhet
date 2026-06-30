import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/store';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, setProfile } = useAuth();

  useEffect(() => {
    // При загрузке страницы Supabase автоматически обработает токены,
    // если они есть в URL (access_token, refresh_token и т.д.)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        toast.error('Ошибка входа, попробуйте снова');
        router.push('/login');
        return;
      }
      if (session?.user) {
        setUser(session.user);
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setProfile(profile);
            toast.success('Добро пожаловать!');
            router.push(profile?.role === 'admin' ? '/admin' : '/');
          });
      } else {
        toast.error('Не удалось войти');
        router.push('/login');
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <p className="text-gray-500 text-lg">Выполняем вход...</p>
    </div>
  );
}
