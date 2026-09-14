import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Empty, SectionTitle, SkeletonCards } from '../components/Ui';
import ShopTeaser from '../components/ShopTeaser';
import { supabase } from '../lib/supabase';
import { plural } from '../lib/format';
import { IconStore } from '../components/Icons';

export default function Masters() {
  const [shops, setShops] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    supabase
      .from('shops')
      .select('id,slug,name,tagline,city,avatar_url,cover_url,theme')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const list = data || [];
        setShops(list);
        if (!list.length) return;
        const { data: prods } = await supabase
          .from('products')
          .select('seller_id')
          .eq('status', 'active')
          .in('seller_id', list.map((s) => s.id));
        const map = {};
        (prods || []).forEach((p) => {
          map[p.seller_id] = (map[p.seller_id] || 0) + 1;
        });
        setCounts(map);
      });
  }, []);

  return (
    <Layout title="Мастерицы">
      <SectionTitle
        right={
          shops && (
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {shops.length} {plural(shops.length, ['мастерская', 'мастерские', 'мастерских'])}
            </span>
          )
        }
      >
        Наши мастерицы
      </SectionTitle>

      {shops === null ? (
        <SkeletonCards count={6} />
      ) : shops.length === 0 ? (
        <Empty
          icon={IconStore}
          title="Пока ни одной мастерской"
          text="Будьте первой: откройте страницу, загрузите фото работ и расскажите о себе."
          action={<Link href="/dashboard/buyer/" className="btn-primary">Открыть мастерскую</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map((s) => (
            <ShopTeaser key={s.id} shop={s} productsCount={counts[s.id] || 0} />
          ))}
        </div>
      )}
    </Layout>
  );
}
