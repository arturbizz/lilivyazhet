import { supabase } from './supabase';

const BUCKET = 'media';
export const MAX_VIDEO_MB = 50;
const TYPES = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
};

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data?.session?.user?.id;
  if (!id) throw new Error('Войдите в аккаунт');
  return id;
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

/* Сжимаем фото прямо в браузере: длинная сторона до 1600px, JPEG 85%.
   Фото с телефона весят 3–8 МБ — после сжатия 200–400 КБ. */
export async function compressImage(file, { maxSide = 1600, quality = 0.85 } = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  let src;
  try {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      src = await loadImageElement(file);
    } catch {
      throw new Error('Не удалось прочитать фото. Сохраните его как JPG или PNG и попробуйте снова.');
    }
  }
  const w0 = src.naturalWidth || src.width;
  const h0 = src.naturalHeight || src.height;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  if (scale === 1 && file.type === 'image/jpeg' && file.size < 450 * 1024) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w0 * scale);
  canvas.height = Math.round(h0 * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
  return blob || file;
}

/* Загрузка в хранилище: <id пользователя>/<папка>/<время>-<случайное>.<расширение> */
export async function uploadFile(file, folder = 'misc') {
  const uid = await currentUserId();
  const type = file.type || 'application/octet-stream';
  const ext = TYPES[type] || (file.name?.split('.').pop() || 'bin').toLowerCase();
  const path = `${uid}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: type, cacheControl: '31536000', upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadImage(file, folder = 'photos') {
  const blob = await compressImage(file);
  return uploadFile(blob, folder);
}

/* Длительность, размеры и обложка видео (кадр из начала) */
export function readVideoMeta(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    let finished = false;
    const finish = (res) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(res);
    };
    const empty = () => finish({ duration: v.duration || 0, width: v.videoWidth || 0, height: v.videoHeight || 0, poster: null });
    const timer = setTimeout(empty, 6000);
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.onloadeddata = () => {
      try {
        v.currentTime = Math.min(0.6, (v.duration || 1) / 3);
      } catch {
        empty();
      }
    };
    v.onseeked = () => {
      try {
        const w = v.videoWidth;
        const h = v.videoHeight;
        const scale = Math.min(1, 720 / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.round(w * scale);
        c.height = Math.round(h * scale);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob((blob) => finish({ duration: v.duration, width: w, height: h, poster: blob }), 'image/jpeg', 0.8);
      } catch {
        empty();
      }
    };
    v.onerror = empty;
    v.src = url;
  });
}

/* Видео: проверка, обложка, загрузка. Возвращает { url, poster_url, vertical } */
export async function uploadVideo(file, folder = 'videos') {
  if (!/^video\/(mp4|quicktime|webm)$/.test(file.type)) {
    throw new Error('Подойдут видео в форматах MP4, MOV или WEBM.');
  }
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    throw new Error(`Файл больше ${MAX_VIDEO_MB} МБ. Сократите видео или загрузите его на VK Видео / Rutube и вставьте ссылку.`);
  }
  const meta = await readVideoMeta(file);
  const url = await uploadFile(file, folder);
  let poster_url = null;
  if (meta.poster) {
    try { poster_url = await uploadFile(meta.poster, `${folder}/posters`); } catch { poster_url = null; }
  }
  return { url, poster_url, vertical: meta.height > meta.width };
}

/* Удаление файла из хранилища по публичной ссылке (если файл наш) */
export async function removeFile(publicUrl) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const s = String(publicUrl || '');
  const i = s.indexOf(marker);
  if (i === -1) return;
  const path = decodeURIComponent(s.slice(i + marker.length).split('?')[0]);
  try { await supabase.storage.from(BUCKET).remove([path]); } catch { /* не критично */ }
}
