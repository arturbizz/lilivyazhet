import { useEffect } from 'react';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth, useCart } from '../lib/store';

export default function App({ Component, pageProps }) {
  const loadAccount = useAuth((s) => s.loadAccount);

  useEffect(() => {
    useCart.persist.rehydrate();

    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) loadAccount(session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'TOKEN_REFRESHED') return;
      loadAccount(session?.user || null);
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, [loadAccount]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '9999px',
            padding: '10px 18px',
            fontSize: '14px',
            border: '1px solid #F1F3F5',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          },
          success: { iconTheme: { primary: '#00E5A0', secondary: '#fff' } },
        }}
      />
    </>
  );
}
