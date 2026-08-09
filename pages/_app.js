import { useEffect } from 'react';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/store';

export default function App({ Component, pageProps }) {
  const { setUser, setProfile } = useAuth();

  useEffect(() => {
    const loadProfile = async (user) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

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
