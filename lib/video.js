/* Разбор ссылок на видео. Встраиваем только проверенные площадки:
   VK Видео, Rutube, YouTube, Одноклассники — и файлы из нашего хранилища. */

const STORAGE_HINT = '/storage/v1/object/public/';

export const VIDEO_HELP =
  'Ссылка на VK Видео, Rutube, YouTube или Одноклассники. Если видео не показывается — вставьте «код для встраивания» (iframe) со страницы видео.';

export function extractIframeSrc(input) {
  const s = String(input || '').trim();
  const m = s.match(/src=["']([^"']+)["']/i);
  return m ? m[1].replace(/&amp;/g, '&') : s;
}

export function parseVideo(raw) {
  const input = extractIframeSrc(raw);
  if (!input) return null;
  let url;
  try {
    url = new URL(input.startsWith('//') ? `https:${input}` : input);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^(www|m)\./, '');
  const path = url.pathname;

  // файл из хранилища или прямая ссылка на видеофайл
  if (path.includes(STORAGE_HINT) || /\.(mp4|webm|mov|m4v)$/i.test(path)) {
    return { type: 'file', provider: 'file', src: url.href };
  }

  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    let id = '';
    if (host === 'youtu.be') id = path.slice(1);
    else if (path.startsWith('/watch')) id = url.searchParams.get('v') || '';
    else {
      const m = path.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
      if (m) id = m[1];
    }
    if (!/^[\w-]{6,20}$/.test(id)) return null;
    return {
      type: 'embed',
      provider: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,
      vertical: path.startsWith('/shorts'),
    };
  }

  if (host === 'rutube.ru') {
    const m = path.match(/^\/(?:video|shorts|play\/embed)\/(?:private\/)?([a-f0-9]{20,40})/i);
    if (!m) return null;
    const p = url.searchParams.get('p');
    return {
      type: 'embed',
      provider: 'rutube',
      src: `https://rutube.ru/play/embed/${m[1]}${p ? `?p=${encodeURIComponent(p)}` : ''}`,
      vertical: path.startsWith('/shorts'),
    };
  }

  if (host === 'vk.com' || host === 'vk.ru' || host === 'vkvideo.ru') {
    let oid = '';
    let id = '';
    let hash = '';
    if (path.startsWith('/video_ext.php')) {
      oid = url.searchParams.get('oid') || '';
      id = url.searchParams.get('id') || '';
      hash = url.searchParams.get('hash') || '';
    } else {
      const m = `${path}${url.search}`.match(/(?:video|clip)(-?\d+)_(\d+)/);
      if (m) {
        oid = m[1];
        id = m[2];
      }
    }
    if (!/^-?\d+$/.test(oid) || !/^\d+$/.test(id)) return null;
    const q = new URLSearchParams({ oid, id, hd: '2' });
    if (/^\w+$/.test(hash)) q.set('hash', hash);
    const embedHost = host === 'vkvideo.ru' ? 'vkvideo.ru' : 'vk.com';
    return { type: 'embed', provider: 'vk', src: `https://${embedHost}/video_ext.php?${q}`, vertical: /clip/.test(path) };
  }

  if (host === 'ok.ru') {
    const m = path.match(/^\/(?:video|videoembed)\/(\d+)/);
    if (!m) return null;
    return { type: 'embed', provider: 'ok', src: `https://ok.ru/videoembed/${m[1]}` };
  }
  return null;
}

/* Что сохранить в базу: для iframe-кода — только адрес плеера */
export function normalizeVideoInput(raw) {
  const src = extractIframeSrc(raw);
  return parseVideo(src) ? src : null;
}
