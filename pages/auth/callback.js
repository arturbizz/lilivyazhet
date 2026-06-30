import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/store';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, setProfile } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session) {
        toast.error('Ошибка входа, попробуйте снова');
        router.push('/login');
        return;
      }
      const user = session.user;
      setUser(user);

      // Проверяем, есть ли профиль, если нет – создаём
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Создаём профиль из метаданных
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Пользователь',
            role: user.user_metadata?.role || 'customer',
          })
          .select()
          .single();
        if (insertError) {
          toast.error('Ошибка создания профиля');
          router.push('/login');
          return;
        }
        setProfile(newProfile);
      } else {
        setProfile(profile);
      }

      toast.success('Добро пожаловать!');
      const currentProfile = profile || newProfile;
      router.push(currentProfile?.role === 'admin' ? '/admin' : '/');
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <p className="text-gray-500 text-lg">Выполняем вход...</p>
    </div>
  );
}
