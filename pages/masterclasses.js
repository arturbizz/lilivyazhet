import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import VideoPlayer from '../components/VideoPlayer';
import { Empty, Img, SectionTitle, SkeletonCards } from '../components/Ui';
import { IconVideo } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { rub } from '../lib/format';
import { shopUrl } from '../lib/config';

export default function Masterclasses() {
  const [list, setList] = useState(null);

  useEffect(() => {
    supabase
      .from('masterclasses')
      .select('*, shop:shops(name,slug,avatar_url,is_published)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setList(data || []));
  }, []);

  return (
    <Layout title="Мастер‑классы">
      <SectionTitle>Мастер‑классы</SectionTitle>
      <p className="text-gray-500 max-w-2xl mb-8 leading-relaxed">
        Мастерицы показывают, как рождаются их работы: от первой петли до готовой игрушки.
      </p>

      {list === null ? (
        <SkeletonCards count={4} className="grid sm:grid-cols-2 gap-6" />
      ) : list.length === 0 ? (
        <Empty
          icon={IconVideo}
          title="Мастер‑классов пока нет"
          text="Если вы мастерица — запишите свой первый и покажите, как вы работаете."
          action={<Link href="/dashboard/master/" className="btn-primary">Добавить мастер‑класс</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-7">
          {list.map((mc) => (
            <div key={mc.id} className="card p-5">
              {mc.video_url ? (
                <VideoPlayer url={mc.video_url} poster={mc.cover_url} title={mc.title} className="mb-4" />
              ) : (
                <div className="aspect-video rounded-2xl aurora-chip mb-4">
                  <IconVideo size={30} />
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading font-semibold text-lg text-gray-900 leading-snug">{mc.title}</h3>
                <span className="font-bold aurora-text whitespace-nowrap">
                  {Number(mc.price) > 0 ? rub(mc.price) : 'Бесплатно'}
                </span>
              </div>
              {mc.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">{mc.description}</p>}
              {mc.shop?.slug && mc.shop.is_published && (
                <Link href={shopUrl(mc.shop.slug)} className="flex items-center gap-2.5 mt-4 text-sm text-gray-500 hover:text-gray-900 w-fit">
                  <span className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <Img src={mc.shop.avatar_url} alt="" className="w-full h-full" />
                  </span>
                  {mc.shop.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
