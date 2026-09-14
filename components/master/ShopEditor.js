import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Field, Img, Notice, Toggle } from '../Ui';
import { SingleImageUploader } from '../Uploaders';
import { IconEye, IconPlus, IconTrash, Spinner, IconLink } from '../Icons';
import { supabase, humanError } from '../../lib/supabase';
import { SHOP_THEMES, themeGradient, themeVars } from '../../lib/themes';
import { SLUG_RE, initials, rub, slugify } from '../../lib/format';
import { absoluteUrl, shopUrl } from '../../lib/config';

const SOCIAL_FIELDS = [
  { key: 'telegram', label: 'Telegram', placeholder: '@masterica или ссылка' },
  { key: 'vk', label: 'ВКонтакте', placeholder: 'ссылка на страницу' },
  { key: 'instagram', label: 'Instagram', placeholder: 'ник или ссылка' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+7 999 123‑45‑67' },
];

const DELIVERY_PRESETS = [
  { id: 'post', name: 'Почта России', price: 350, days: '5–10 дней' },
  { id: 'cdek', name: 'СДЭК до пункта выдачи', price: 400, days: '3–7 дней' },
  { id: 'pickup', name: 'Самовывоз', price: 0, days: 'по договорённости' },
  { id: 'courier', name: 'Курьером по городу', price: 300, days: '1–2 дня' },
];

export default function ShopEditor({ shop, onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shop) return;
    setForm({
      name: shop.name || '',
      slug: shop.slug || '',
      tagline: shop.tagline || '',
      bio: shop.bio || '',
      city: shop.city || '',
      avatar_url: shop.avatar_url || null,
      cover_url: shop.cover_url || null,
      theme: shop.theme || 'aurora',
      socials: shop.socials && typeof shop.socials === 'object' ? shop.socials : {},
      delivery_options: Array.isArray(shop.delivery_options) ? shop.delivery_options : [],
      free_shipping_from: shop.free_shipping_from ?? '',
      delivery_note: shop.delivery_note || '',
      processing_days: shop.processing_days ?? '',
      legal_name: shop.legal_name || '',
      inn: shop.inn || '',
      is_published: Boolean(shop.is_published),
    });
  }, [shop]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSocial = (key, value) => setForm((f) => ({ ...f, socials: { ...f.socials, [key]: value } }));

  const slugError = useMemo(() => {
    if (!form?.slug) return null;
    return SLUG_RE.test(form.slug) ? null : 'Только латиница, цифры и дефис, от 3 до 40 символов';
  }, [form?.slug]);

  const addDelivery = (preset) => {
    const list = form.delivery_options;
    const id = preset?.id || `opt${Date.now().toString(36)}`;
    if (list.some((d) => d.id === id)) return;
    set('delivery_options', [...list, preset ? { ...preset } : { id, name: '', price: 0, days: '' }]);
  };
  const updDelivery = (i, key, value) =>
    set('delivery_options', form.delivery_options.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)));
  const delDelivery = (i) => set('delivery_options', form.delivery_options.filter((_, idx) => idx !== i));

  const save = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('Придумайте название мастерской.');
    if (slugError) return setError(slugError);

    const cleanDelivery = form.delivery_options
      .filter((d) => String(d.name || '').trim())
      .map((d, i) => ({
        id: String(d.id || `opt${i}`).slice(0, 30),
        name: String(d.name).trim().slice(0, 60),
        price: Math.max(0, Number(d.price) || 0),
        days: String(d.days || '').trim().slice(0, 40),
      }));

    const socials = {};
    Object.entries(form.socials).forEach(([k, v]) => {
      const val = String(v || '').trim();
      if (val) socials[k] = val.slice(0, 200);
    });

    if (form.is_published && !cleanDelivery.length) {
      setError('Добавьте хотя бы один способ доставки — покупатель должен понимать, как получит заказ.');
      return;
    }

    setBusy(true);
    const payload = {
      name: form.name.trim().slice(0, 80),
      slug: (form.slug || slugify(form.name) || `master-${Date.now().toString(36)}`).toLowerCase(),
      tagline: form.tagline.trim().slice(0, 160) || null,
      bio: form.bio.trim().slice(0, 4000) || null,
      city: form.city.trim().slice(0, 60) || null,
      avatar_url: form.avatar_url,
      cover_url: form.cover_url,
      theme: form.theme,
      socials,
      delivery_options: cleanDelivery,
      free_shipping_from: form.free_shipping_from === '' ? null : Math.max(0, Number(form.free_shipping_from) || 0),
      delivery_note: form.delivery_note.trim().slice(0, 500) || null,
      processing_days: form.processing_days === '' ? null : Math.max(0, Math.min(180, Number(form.processing_days) || 0)),
      legal_name: form.legal_name.trim().slice(0, 120) || null,
      inn: form.inn.trim().slice(0, 20) || null,
      is_published: form.is_published,
    };

    const { data, error: err } = await supabase.from('shops').update(payload).eq('id', shop.id).select().maybeSingle();
    setBusy(false);
    if (err) {
      setError(humanError(err, 'Не удалось сохранить. Проверьте поля и попробуйте ещё раз.'));
      return;
    }
    toast.success('Страница сохранена');
    onSaved?.(data);
  };

  if (!form) return null;
  const publicUrl = absoluteUrl(shopUrl(form.slug || shop.slug));

  return (
    <form onSubmit={save} className="space-y-6" style={themeVars(form.theme)}>
      {/* Предпросмотр */}
      <div className="panel p-0 overflow-hidden">
        <div className="relative h-28 sm:h-36">
          {form.cover_url ? (
            <Img src={form.cover_url} alt="" className="absolute inset-0 w-full h-full" />
          ) : (
            <div className="absolute inset-0" style={{ background: themeGradient(form.theme), opacity: 0.9 }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
        </div>
        <div className="px-5 sm:px-7 pb-6 -mt-10 relative flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="aurora-ring w-20 h-20">
            <div className="w-full h-full flex items-center justify-center bg-white">
              {form.avatar_url ? (
                <Img src={form.avatar_url} alt="" className="w-full h-full" />
              ) : (
                <span className="font-heading font-bold text-gray-300">{initials(form.name)}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-xl text-gray-900 line-clamp-1">{form.name || 'Название мастерской'}</p>
            <p className="text-sm text-gray-500 line-clamp-1">{form.tagline || 'Короткая строка о себе'}</p>
          </div>
          {shop.is_published && (
            <Link href={shopUrl(shop.slug)} target="_blank" className="btn-secondary text-sm py-2 px-4">
              <IconEye size={15} /> Смотреть
            </Link>
          )}
        </div>
      </div>

      {/* Публикация */}
      <div className="panel">
        <Toggle
          checked={form.is_published}
          onChange={(v) => set('is_published', v)}
          label="Мастерская видна покупателям"
          hint="Пока выключено, страницу и работы видите только вы — удобно готовить всё заранее."
        />
        {form.is_published && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-gray-50 rounded-2xl px-4 py-3">
            <IconLink size={15} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 truncate select-text">{publicUrl}</span>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(publicUrl); toast.success('Ссылка скопирована'); }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-900 whitespace-nowrap"
            >
              Копировать
            </button>
          </div>
        )}
      </div>

      {/* Основное */}
      <div className="panel space-y-5">
        <h3 className="font-heading font-semibold text-lg">О мастерской</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Название">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className="input"
              placeholder="Лилины игрушки" maxLength={80} required />
          </Field>
          <Field label="Город" hint="Покупателям важно понимать, откуда поедет посылка.">
            <input value={form.city} onChange={(e) => set('city', e.target.value)} className="input" placeholder="Мурманск" maxLength={60} />
          </Field>
        </div>

        <Field
          label="Адрес страницы"
          error={slugError}
          hint={`Так будет выглядеть ссылка: /master/?s=${form.slug || 'адрес'}`}
        >
          <div className="flex gap-2">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().trim())}
              className="input" placeholder="lilinye-igrushki" maxLength={40} />
            <button type="button" onClick={() => set('slug', slugify(form.name))} className="btn-secondary text-sm px-4 whitespace-nowrap">
              Из названия
            </button>
          </div>
        </Field>

        <Field label="Одна строка о себе" hint="Она видна под названием и в списке мастериц.">
          <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} className="input"
            placeholder="Вяжу зверят, которые обнимают" maxLength={160} />
        </Field>

        <Field label="Рассказ о себе" hint="Как вы пришли к рукоделию, из чего делаете, сколько времени уходит на работу.">
          <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} className="textarea" rows={6} maxLength={4000} />
        </Field>
      </div>

      {/* Оформление */}
      <div className="panel space-y-6">
        <h3 className="font-heading font-semibold text-lg">Как выглядит страница</h3>

        <div className="grid sm:grid-cols-2 gap-6">
          <SingleImageUploader
            value={form.avatar_url}
            onChange={(v) => set('avatar_url', v)}
            folder="shop"
            shape="circle"
            label="Фото мастерицы или логотип"
            hint="Квадратное фото, лучше всего лицо или узнаваемая работа."
          />
          <SingleImageUploader
            value={form.cover_url}
            onChange={(v) => set('cover_url', v)}
            folder="shop"
            shape="cover"
            label="Обложка"
            hint="Широкое фото: рабочее место, пряжа, разложенные работы."
          />
        </div>

        <Field label="Цвета страницы" hint="Сияние подстроится под выбранную тему — кнопки, рамки и кольцо вокруг фото.">
          <div className="flex flex-wrap gap-3">
            {Object.entries(SHOP_THEMES).map(([key, t]) => (
              <button key={key} type="button" onClick={() => set('theme', key)}
                className={`rounded-2xl border-2 p-1 transition-all ${form.theme === key ? 'border-gray-900' : 'border-transparent hover:border-gray-200'}`}>
                <span className="block w-20 h-12 rounded-xl" style={{ background: themeGradient(key) }} />
                <span className="block text-[11px] text-gray-500 mt-1.5">{t.name}</span>
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* Доставка */}
      <div className="panel space-y-5">
        <div>
          <h3 className="font-heading font-semibold text-lg">Доставка</h3>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            Вы отправляете заказы сами. Укажите способы и цены — покупатель выберет при оформлении,
            а стоимость добавится к заказу.
          </p>
        </div>

        <div className="space-y-3">
          {form.delivery_options.map((d, i) => (
            <div key={d.id || i} className="grid grid-cols-12 gap-2 items-start">
              <input value={d.name} onChange={(e) => updDelivery(i, 'name', e.target.value)}
                className="input col-span-12 sm:col-span-5" placeholder="Почта России" maxLength={60} />
              <input value={d.price} onChange={(e) => updDelivery(i, 'price', e.target.value)} type="number" min="0" step="10"
                className="input col-span-5 sm:col-span-3" placeholder="Цена, ₽" />
              <input value={d.days} onChange={(e) => updDelivery(i, 'days', e.target.value)}
                className="input col-span-6 sm:col-span-3" placeholder="5–10 дней" maxLength={40} />
              <button type="button" onClick={() => delDelivery(i)} className="btn-icon col-span-1 mt-1" aria-label="Удалить способ">
                <IconTrash size={16} />
              </button>
            </div>
          ))}
          {form.delivery_options.length === 0 && (
            <p className="text-sm text-gray-400">Пока ни одного способа. Добавьте готовый вариант ниже.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {DELIVERY_PRESETS.filter((p) => !form.delivery_options.some((d) => d.id === p.id)).map((p) => (
            <button key={p.id} type="button" onClick={() => addDelivery(p)} className="pill">
              <IconPlus size={14} /> {p.name} {p.price > 0 ? `· ${rub(p.price)}` : ''}
            </button>
          ))}
          <button type="button" onClick={() => addDelivery(null)} className="pill">
            <IconPlus size={14} /> Свой вариант
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Бесплатная доставка от суммы" hint="Оставьте пустым, если такого нет.">
            <input value={form.free_shipping_from} onChange={(e) => set('free_shipping_from', e.target.value)}
              type="number" min="0" step="100" className="input" placeholder="5000" />
          </Field>
          <Field label="За сколько дней отправляете" hint="Покупатель увидит это на вашей странице.">
            <input value={form.processing_days} onChange={(e) => set('processing_days', e.target.value)}
              type="number" min="0" max="180" className="input" placeholder="3" />
          </Field>
        </div>

        <Field label="Что важно знать о доставке">
          <textarea value={form.delivery_note} onChange={(e) => set('delivery_note', e.target.value)} className="textarea" rows={3}
            maxLength={500} placeholder="Отправляю по вторникам и пятницам. Упаковываю в крафт с пузырчатой плёнкой." />
        </Field>
      </div>

      {/* Связь и реквизиты */}
      <div className="panel space-y-5">
        <h3 className="font-heading font-semibold text-lg">Связь и реквизиты</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {SOCIAL_FIELDS.map((s) => (
            <Field key={s.key} label={s.label}>
              <input value={form.socials[s.key] || ''} onChange={(e) => setSocial(s.key, e.target.value)}
                className="input" placeholder={s.placeholder} maxLength={200} />
            </Field>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Кто продавец" hint="ФИО или название — покупатель видит это в разделе «О мастерской».">
            <input value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} className="input"
              placeholder="Иванова Лилия Петровна" maxLength={120} />
          </Field>
          <Field label="ИНН (если есть)" hint="Нужен самозанятым и ИП для чеков.">
            <input value={form.inn} onChange={(e) => set('inn', e.target.value)} className="input" placeholder="123456789012" maxLength={20} />
          </Field>
        </div>
      </div>

      {error && <Notice type="error">{error}</Notice>}

      <div className="sticky bottom-4 z-10">
        <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-base shadow-lg">
          {busy ? <Spinner /> : 'Сохранить страницу'}
        </button>
      </div>
    </form>
  );
}

