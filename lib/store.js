import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from './supabase';
import { maxQty } from './format';

/* ---------- Корзина (хранится в браузере, работает и без входа) ---------- */
function toCartItem(p, prev = {}) {
  return {
    id: p.id,
    title: p.title,
    price: Number(p.price),
    image: p.images?.[0] || p.image || prev.image || null,
    seller_id: p.seller_id,
    shop_name: p.shop?.name || p.shop_name || prev.shop_name || 'Мастерская',
    shop_slug: p.shop?.slug || p.shop_slug || prev.shop_slug || '',
    shop_avatar: p.shop?.avatar_url || p.shop_avatar || prev.shop_avatar || null,
    stock: Number(p.stock ?? prev.stock ?? 0),
    made_to_order: Boolean(p.made_to_order),
  };
}

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      /* возвращает true, если количество увеличилось */
      addItem: (product, qty = 1) => {
        const limit = maxQty(product);
        const items = get().items;
        const existing = items.find((i) => i.id === product.id);
        const current = existing?.qty || 0;
        const next = Math.min(limit, current + qty);
        if (next <= current) return false;
        const item = { ...toCartItem(product, existing), qty: next };
        set({ items: existing ? items.map((i) => (i.id === product.id ? item : i)) : [...items, item] });
        return true;
      },
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(maxQty(i), qty)) } : i)),
        })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clearCart: () => set({ items: [] }),
      replaceItems: (items) => set({ items }),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: 'lv-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      skipHydration: true,
    }
  )
);

/* true, когда корзина уже прочитана из браузера */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCart.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useCart.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

/* Сверяем корзину с базой: цены, остатки, снятые с продажи товары */
export async function syncCartWithDb() {
  const { items, replaceItems } = useCart.getState();
  if (!items.length) return { removed: 0, changed: false };
  const { data, error } = await supabase
    .from('products')
    .select('id,title,price,images,stock,made_to_order,status,seller_id,shop:shops(name,slug,avatar_url)')
    .in('id', items.map((i) => i.id));
  if (error || !data) return { removed: 0, changed: false };
  const byId = Object.fromEntries(data.map((p) => [p.id, p]));
  let removed = 0;
  let changed = false;
  const next = [];
  for (const it of items) {
    const p = byId[it.id];
    if (!p || p.status !== 'active' || maxQty(p) <= 0) {
      removed += 1;
      continue;
    }
    const fresh = toCartItem(p, it);
    const qty = Math.min(it.qty, maxQty(p));
    if (fresh.price !== it.price || qty !== it.qty) changed = true;
    next.push({ ...fresh, qty });
  }
  if (removed || changed) replaceItems(next);
  return { removed, changed };
}

/* ---------- Аккаунт ---------- */
export const useAuth = create((set, get) => ({
  user: null,
  profile: null,
  shop: null,
  ready: false,
  setProfile: (profile) => set({ profile }),
  setShop: (shop) => set({ shop }),
  loadAccount: async (user) => {
    if (!user) {
      set({ user: null, profile: null, shop: null, ready: true });
      return;
    }
    set({ user });
    let { data: profile, error } = await supabase.rpc('ensure_profile');
    if (error) {
      const res = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      profile = res.data;
    }
    const { data: shop } = await supabase.from('shops').select('*').eq('id', user.id).maybeSingle();
    set({ user, profile: profile || null, shop: shop || null, ready: true });
  },
  refreshShop: async () => {
    const u = get().user;
    if (!u) return null;
    const { data } = await supabase.from('shops').select('*').eq('id', u.id).maybeSingle();
    set({ shop: data || null });
    return data;
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, shop: null });
  },
}));
