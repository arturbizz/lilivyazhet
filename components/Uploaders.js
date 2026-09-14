import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MAX_VIDEO_MB, uploadImage, uploadVideo, removeFile } from '../lib/media';
import { humanError } from '../lib/supabase';
import { Img } from './Ui';
import { IconClose, IconImage, IconPlus, IconUpload, IconVideo, Spinner, IconChevronLeft, IconChevronRight } from './Icons';

/* Загрузка нескольких фото с превью и изменением порядка.
   Первое фото становится обложкой товара. */
export function PhotoUploader({ value = [], onChange, max = 8, folder = 'photos', label = 'Фотографии' }) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const room = max - value.length;
    if (room <= 0) return toast.error(`Можно загрузить не больше ${max} фото`);
    const chosen = files.slice(0, room);
    if (files.length > room) toast(`Добавили первые ${room} — это максимум`, { icon: '🧶' });

    setBusy(true);
    const done = [];
    for (const file of chosen) {
      try {
        done.push(await uploadImage(file, folder));
      } catch (e) {
        toast.error(humanError(e, 'Не удалось загрузить фото'));
      }
    }
    if (done.length) {
      onChange([...value, ...done]);
      toast.success(done.length > 1 ? `Загружено фото: ${done.length}` : 'Фото загружено');
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const move = (from, to) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const remove = (i) => {
    const url = value[i];
    onChange(value.filter((_, idx) => idx !== i));
    removeFile(url);
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, i) => (
          <div key={url + i} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
            <Img src={url} alt="" className="w-full h-full" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 badge bg-white/90 text-gray-700 text-[10px] px-2 py-0.5">Обложка</span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Удалить фото"
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-gray-600 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-red-500"
            >
              <IconClose size={14} />
            </button>
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                className="w-7 h-7 rounded-full bg-white/90 text-gray-600 flex items-center justify-center disabled:opacity-0" aria-label="Левее">
                <IconChevronLeft size={14} />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}
                className="w-7 h-7 rounded-full bg-white/90 text-gray-600 flex items-center justify-center disabled:opacity-0" aria-label="Правее">
                <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
            className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-gray-400 transition-colors ${
              drag ? 'border-aurora-green bg-aurora-green/5 text-aurora-green' : 'border-gray-200 hover:border-gray-300 hover:text-gray-600'
            }`}
          >
            {busy ? <Spinner size={20} /> : <IconPlus size={22} />}
            <span className="text-xs font-medium">{busy ? 'Загрузка…' : 'Добавить'}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      <p className="hint">
        Фото сжимаются автоматически. Первое — обложка, порядок можно менять стрелками.
        Снимайте при дневном свете на однотонном фоне — так работы выглядят дороже.
      </p>
    </div>
  );
}

/* Одна картинка: аватар или обложка мастерской */
export function SingleImageUploader({ value, onChange, folder = 'shop', label, shape = 'square', hint }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const pick = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setBusy(true);
    try {
      const url = await uploadImage(file, folder);
      if (value) removeFile(value);
      onChange(url);
      toast.success('Готово');
    } catch (e) {
      toast.error(humanError(e, 'Не удалось загрузить изображение'));
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const box =
    shape === 'circle'
      ? 'w-24 h-24 rounded-full'
      : shape === 'cover'
      ? 'w-full h-32 sm:h-40 rounded-2xl'
      : 'w-32 h-32 rounded-2xl';

  const isCover = shape === 'cover';

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className={isCover ? 'flex flex-col items-start gap-3' : 'flex items-center gap-4'}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          className={`${box} relative overflow-hidden border-2 border-dashed border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50 flex-shrink-0`}
        >
          {value ? <Img src={value} alt="" className="absolute inset-0 w-full h-full" /> : busy ? <Spinner /> : <IconImage size={22} />}
          {busy && value && (
            <span className="absolute inset-0 bg-white/70 flex items-center justify-center"><Spinner /></span>
          )}
        </button>
        <div className={isCover ? 'flex items-center gap-3' : 'text-sm'}>
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary text-sm py-2 px-4">
            <IconUpload size={15} /> {value ? 'Заменить' : 'Загрузить'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => { removeFile(value); onChange(null); }}
              className={`text-xs text-gray-400 hover:text-red-500 ${isCover ? '' : 'block mt-2 ml-1'}`}
            >
              Убрать
            </button>
          )}
        </div>
      </div>
      {hint && <p className="hint">{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

/* Загрузка видеофайла (шортса или короткого ролика) */
export function VideoUploader({ onUploaded, folder = 'videos', label = 'Загрузить видео' }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadVideo(file, folder);
      onUploaded(res);
      toast.success('Видео загружено');
    } catch (e) {
      toast.error(humanError(e, 'Не удалось загрузить видео'));
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
        className="w-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 py-7 flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {busy ? <Spinner size={22} /> : <IconVideo size={24} />}
        <span className="text-sm font-medium">{busy ? 'Загружаем видео…' : label}</span>
        <span className="text-xs">MP4, MOV или WEBM, до {MAX_VIDEO_MB} МБ</span>
      </button>
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
