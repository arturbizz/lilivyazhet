import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Field, Notice, Toggle } from '../Ui';
import { PhotoUploader, VideoUploader } from '../Uploaders';
import { Spinner } from '../Icons';
import { supabase, humanError } from '../../lib/supabase';
import { normalizeVideoInput, VIDEO_HELP } from '../../lib/video';
import VideoPlayer from '../VideoPlayer';

const EMPTY = {
  title: '',
  price: '',
  description: '',
  category: 'toys',
  images: [],
  video_url: '',
  stock: 1,
  made_to_order: false,
  production_days: '',
  status: 'active',
};

export default function ProductForm({ shopId, categories, product, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title || '',
        price: product.price ?? '',
        description: product.description || '',
        category: product.category || 'toys',
        images: product.images || [],
        video_url: product.video_url || '',
        stock: product.stock ?? 1,
        made_to_order: Boolean(product.made_to_order),
        production_days: product.production_days ?? '',
        status: product.status || 'active',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [product]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError('Как называется работа?');
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) return setError('Укажите цену в рублях — например, 2500.');
    if (!form.images.length) return setError('Добавьте хотя бы одно фото: без него работу не покупают.');

    let video = null;
    if (form.video_url.trim()) {
      video = normalizeVideoInput(form.video_url);
      if (!video) return setError('Не удалось разобрать ссылку на видео. ' + VIDEO_HELP);
    }

    setBusy(true);
    const payload = {
      seller_id: shopId,
      title: form.title.trim().slice(0, 120),
      price,
      description: form.description.trim().slice(0, 4000) || null,
      category: form.category || null,
      images: form.images,
      video_url: video,
      made_to_order: form.made_to_order,
      stock: form.made_to_order ? 0 : Math.max(0, Math.min(999, Number(form.stock) || 0)),
      production_days:
        form.made_to_order && form.production_days !== '' ? Math.max(1, Math.min(180, Number(form.production_days) || 0)) : null,
      status: form.status,
    };

    const query = product
      ? supabase.from('products').update(payload).eq('id', product.id).select().maybeSingle()
      : supabase.from('products').insert(payload).select().maybeSingle();
    const { data, error: err } = await query;
    setBusy(false);
    if (err) return setError(humanError(err, 'Не удалось сохранить работу.'));
    toast.success(product ? 'Работа обновлена' : 'Работа добавлена в каталог');
    onSaved?.(data);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PhotoUploader value={form.images} onChange={(v) => set('images', v)} folder="products" max={8} />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Название">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} className="input"
            placeholder="Зайка Тиффани в шарфе" maxLength={120} required />
        </Field>
        <Field label="Цена, ₽">
          <input value={form.price} onChange={(e) => set('price', e.target.value)} type="number" min="1" step="50"
            className="input" placeholder="2500" required />
        </Field>
      </div>

      <Field label="Категория">
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Описание" hint="Размер, материалы, уход, сколько времени заняла работа — это то, о чём спрашивают чаще всего.">
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="textarea"
          rows={5} maxLength={4000} placeholder="Рост 28 см, хлопок и холлофайбер. Можно стирать руками в тёплой воде." />
      </Field>

      <div className="panel p-5 space-y-4 bg-gray-50/60">
        <Toggle
          checked={form.made_to_order}
          onChange={(v) => set('made_to_order', v)}
          label="Делаю на заказ"
          hint="Тогда количество не ограничено, а покупатель увидит срок изготовления."
        />
        {form.made_to_order ? (
          <Field label="Срок изготовления, дней">
            <input value={form.production_days} onChange={(e) => set('production_days', e.target.value)} type="number"
              min="1" max="180" className="input" placeholder="14" />
          </Field>
        ) : (
          <Field label="Сколько штук в наличии" hint="Когда закончится, работа автоматически станет недоступной для заказа.">
            <input value={form.stock} onChange={(e) => set('stock', e.target.value)} type="number" min="0" max="999" className="input" />
          </Field>
        )}
      </div>

      <Field label="Видео работы" hint={VIDEO_HELP}>
        <input value={form.video_url} onChange={(e) => set('video_url', e.target.value)} className="input"
          placeholder="https://vkvideo.ru/video-123_456" />
      </Field>
      <VideoUploader folder="products" label="Или загрузить видеофайл" onUploaded={({ url }) => set('video_url', url)} />
      {form.video_url && (
        <div className="max-w-sm">
          <VideoPlayer url={form.video_url} poster={form.images[0]} title={form.title} />
          <button type="button" onClick={() => set('video_url', '')} className="text-xs text-gray-400 hover:text-red-500 mt-2">
            Убрать видео
          </button>
        </div>
      )}

      <Field label="Показывать в каталоге">
        <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
          <option value="active">Да, работа в продаже</option>
          <option value="draft">Пока черновик — вижу только я</option>
          <option value="archived">В архиве</option>
        </select>
      </Field>

      {error && <Notice type="error">{error}</Notice>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={busy} className="btn-primary flex-1 py-3">
          {busy ? <Spinner /> : product ? 'Сохранить' : 'Добавить работу'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary px-6 py-3">Отмена</button>
        )}
      </div>
    </form>
  );
}
