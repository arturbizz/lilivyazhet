import { create } from 'zustand';
import { supabase } from './supabase';

export const useCart = create((set, get) => ({
  items: [],
  addItem: (product) => set((state) => {
    const existing = state.items.find(i => i.id === product.id);
    if (existing) {
      return { items: state.items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) };
    }
    return { items: [...state.items, { ...product, qty: 1 }] };
  }),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));

export const useAuth = create((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  }
}));
