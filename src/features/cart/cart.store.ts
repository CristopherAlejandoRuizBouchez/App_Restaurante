"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setNotes: (productId: string, notes: string) => void;
  clear: () => void;
  totalCents: () => number;
  totalItems: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId,
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + quantity, 50) }
                  : i,
              ),
            };
          }

          return { items: [...state.items, { ...item, quantity }] };
        }),

      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.productId !== productId),
            };
          }

          return {
            items: state.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.min(quantity, 50) }
                : i,
            ),
          };
        }),

      setNotes: (productId, notes) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, notes } : i,
          ),
        })),

      clear: () => set({ items: [] }),

      totalCents: () =>
        get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "smq-cart" },
  ),
);
