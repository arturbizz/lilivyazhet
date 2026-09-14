import { useState } from 'react';
import toast from 'react-hot-toast';
import { Empty, Field, Img, Modal, Notice } from '../Ui';
import { PhotoUploader, VideoUploader } from '../Uploaders';
import VideoPlayer from '../VideoPlayer';
import { IconPlus, IconTrash, IconVideo, IconImage, Spinner } from '../Icons';
import { supabase, humanError } from '../../lib/supabase';
import { removeFile } from '../../lib/media';
import { normalizeVideoInput, VIDEO_HELP } from '../../lib/video';

const KINDS = [
  { key: 'short', label: 'Шортсы', hint: 'Вертикальные ролики до минуты — их видно на главной странице сайта.' },
  { key: 'video', label: 'Видео', hint: 'Полноценные ролики: обзор работы, процесс, распаковка.' },
  { key: 'photo', label: 'Фото', hint: 'Рабочее место, процесс, детали — всё, что показывает вашу кухню.' },
];

export default function MediaManager({ shopId, media, products, onChanged }) {
  const [kind, setKind] = useState('short');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState({ url: '', poster_url: '', title: '', product_id: '' });

  const list = media.filter((m) => m.kind === kind);
  const current = KINDS.find((k) => k.key === kind);

  const reset = () => {
    setDraft({ url: '', poster_url: '', title: '', product_id: '' });
    setError(null);
  };

  const addPhotos = async (urls) => {
    if (!urls.length) return;
    setBusy(true);
    const rows = urls.map((url, i) => ({ shop_id: shopId, kind: 'photo', url, sort_order: media.length + i }));
    const { error: err } = await supabase.from('shop_media').insert(rows);
    setBusy(false);
    if (err) return toast.error(humanError(err));
    toast.success('Фото добавлены');
    onChanged?.();
  };

  const saveVideo = async () => {
    setError(null);
    if (!draft.url.trim()) return setError('Загрузите файл или вставьте ссылку на видео.');
    const url = normalizeVideoInput(draft.url);
    if (!url) return setError('Не получилось разобрать ссылку. ' + VIDEO_HELP);

    setBusy(true);
    const { error: err } = await supabase.from('shop_media').insert({
      shop_id: shopId,
      kind,
      url,
      poster_url: draft.poster_url || null,
      title: draft.title.trim().slice(0, 120) || null,
      product_id: draft.product_id || null,
      sort_order: list.length,
    });
    setBusy(false);
    if (err) return setError(humanError(err));
    toast.success(kind === 'short' ? 'Шортс добавлен' : 'Видео добавлено');
    setOpen(false);
    reset();
    onChanged?.();
  };

  const remove = async (item) => {
    const { error: err } = await supabase.from('shop_media').delete().eq('id', item.id);
    if (err) return toast.error(humanError(err));
    removeFile(item.url);
    if (item.poster_url) removeFile(item.poster_url);
    toast.success('Удалено');
    onChanged?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button key={k.key} onClick={() => setKind(k.key)} className={`pill ${kind === k.key ? 'pill-active' : ''}`}>
            {k.key === 'photo' ? <IconImage size={15} /> : <IconVideo size={15} />}
            {k.label}
            <span className="opacity-60">{media.filter((m) => m.kind === k.key).length}</span>
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 leading-relaxed">{current.hint}</p>

      {kind === 'photo' ? (
        <div className="panel">
          <PhotoUploader value={[]} onChange={addPhotos} folder="gallery" max={8} label="Добавить фото в галерею" />
          {busy && <p className="text-sm text-gray-400 mt-3 flex items-center gap-2"><Spinner size={14} /> Сохраняем…</p>}
        </div>
      ) : (
        <button onClick={() => { reset(); setOpen(true); }} className="btn-primary">
          <IconPlus size={17} /> Добавить {kind === 'short' ? 'шортс' : 'видео'}
        </button>
      )}

      {list.length === 0 ? (
        <Empty
          icon={kind === 'photo' ? IconImage : IconVideo}
          title={`Пока нет материалов`}
          text="Покупатели гораздо охотнее заказывают, когда видят живой процесс и детали работы."
        />
      ) : kind === 'photo' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {list.map((m) => (
            <div key={m.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100">
              <Img src={m.url} alt="" className="w-full h-full" />
              <button onClick={() => remove(m)} aria-label="Удалить"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">
                <IconTrash size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-5 ${kind === 'short' ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
          {list.map((m) => (
            <div key={m.id}>
              <VideoPlayer url={m.url} poster={m.poster_url} title={m.title} vertical={kind === 'short'} />
              <div className="flex items-start justify-between gap-2 mt-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{m.title || 'Без названия'}</p>
                  {m.product && <p className="text-xs text-gray-400 line-clamp-1">к работе: {m.product.title}</p>}
                </div>
                <button onClick={() => remove(m)} className="text-gray-300 hover:text-red-500 flex-shrink-0" aria-label="Удалить">
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={kind === 'short' ? 'Новый шортс' : 'Новое видео'}>
        <div className="space-y-5">
          <VideoUploader
            folder={kind === 'short' ? 'shorts' : 'videos'}
            label="Загрузить файл с телефона"
            onUploaded={({ url, poster_url }) => setDraft((d) => ({ ...d, url, poster_url: poster_url || '' }))}
          />

          <div className="flex items-center gap-3">
            <span className="accent-line" />
            <span className="text-xs text-gray-400">или</span>
            <span className="accent-line" />
          </div>

          <Field label="Ссылка на видео" hint={VIDEO_HELP}>
            <input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              className="input" placeholder="https://rutube.ru/video/..." />
          </Field>

          {draft.url && (
            <div className={kind === 'short' ? 'max-w-[240px] mx-auto' : ''}>
              <VideoPlayer url={draft.url} poster={draft.poster_url} vertical={kind === 'short'} />
            </div>
          )}

          <Field label="Подпись">
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="input" placeholder="Как рождается зайка" maxLength={120} />
          </Field>

          <Field label="Связать с работой" hint="Тогда под видео появится кнопка с ценой — можно купить сразу.">
            <select value={draft.product_id} onChange={(e) => setDraft((d) => ({ ...d, product_id: e.target.value }))} className="input">
              <option value="">Не связывать</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </Field>

          {error && <Notice type="error">{error}</Notice>}

          <div className="flex gap-3">
            <button onClick={saveVideo} disabled={busy} className="btn-primary flex-1 py-3">
              {busy ? <Spinner /> : 'Добавить'}
            </button>
            <button onClick={() => setOpen(false)} className="btn-secondary px-6 py-3">Отмена</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
