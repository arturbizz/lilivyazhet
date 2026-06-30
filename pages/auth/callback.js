import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/store';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, setProfile } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setProfile(profile);
            router.push('/');
          });
      } else {
        // Если сессии нет – возможно, токен ещё не обработан, пробуем ещё раз через секунду
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s2 } }) => {
            if (s2?.user) {
              setUser(s2.user);
              supabase
                .from('profiles')
                .select('*')
                .eq('id', s2.user.id)
                .single()
                .then(({ data: profile }) => {
                  setProfile(profile);
                });
            }
            router.push('/');
          });
        }, 1500);
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <p className="text-gray-500 text-lg">Выполняем вход...</p>
    </div>
  );
}
