"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  title: string;
  priceGhs: number;
  photo?: string;
  shopName: string;
  size?: string;
  color?: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    size?: string,
    color?: string
  ) => void;
  clear: () => void;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "fuguaa_cart";

function sameLine(a: CartItem, b: Partial<CartItem>) {
  return (
    a.productId === b.productId && a.size === b.size && a.color === b.color
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reading localStorage (an external system) on mount, to avoid an
    // SSR/client hydration mismatch — this can't run during render.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt cart data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private browsing etc.) — cart just won't persist
    }
  }, [items, hydrated]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, item)
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  }

  function removeItem(productId: string, size?: string, color?: string) {
    setItems((prev) =>
      prev.filter((i) => !sameLine(i, { productId, size, color }))
    );
  }

  function updateQuantity(
    productId: string,
    quantity: number,
    size?: string,
    color?: string
  ) {
    setItems((prev) =>
      prev.map((i) =>
        sameLine(i, { productId, size, color }) ? { ...i, quantity } : i
      )
    );
  }

  function clear() {
    setItems([]);
  }

  const total = items.reduce((sum, i) => sum + i.priceGhs * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
