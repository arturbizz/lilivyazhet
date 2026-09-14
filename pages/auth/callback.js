import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/store';
import { Loading } from '../../components/Ui';

export default function AuthCallback() {
  const router = useRouter();
  const loadAccount = useAuth((s) => s.loadAccount);

  useEffect(() => {
    let done = false;
    const go = async (user) => {
      if (done) return;
      done = true;
      await loadAccount(user || null);
      if (!user) return router.replace('/login/');
      const { data: shop } = await supabase.from('shops').select('id').eq('id', user.id).maybeSingle();
      router.replace(shop ? '/dashboard/master/' : '/');
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) go(session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) go(session.user);
    });

    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      go(data?.session?.user || null);
    }, 4000);

    return () => {
      listener?.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router, loadAccount]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading text="Выполняем вход…" />
    </div>
  );
}
