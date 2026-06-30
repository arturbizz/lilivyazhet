import { useEffect } from 'react';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/store';

export default function App({ Component, pageProps }) {
  const { setUser, setProfile } = useAuth();

  useEffect(() => {
    // Проверяем, вдруг мы уже вошли (например, после клика по ссылке из письма)
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
          });
      }
    });

    // Слушаем изменения авторизации (на будущее)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile }) => {
              setProfile(profile);
            });
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </>
  );
}
