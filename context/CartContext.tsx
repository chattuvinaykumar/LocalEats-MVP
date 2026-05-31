import React, { createContext, useContext, useState, useCallback } from 'react';
import { MenuItem, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  gst: number;
  deliveryFee: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.menuItem.id !== id));
  }, []);

  const incrementItem = useCallback((id: string) => {
    setItems(prev =>
      prev.map(i => (i.menuItem.id === id ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }, []);

  const decrementItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.menuItem.id === id);
      if (item && item.quantity <= 1) {
        return prev.filter(i => i.menuItem.id !== id);
      }
      return prev.map(i =>
        i.menuItem.id === id ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const deliveryFee = items.length > 0 ? 40 : 0;
  const total = subtotal + gst + deliveryFee;
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, incrementItem, decrementItem, clearCart, totalItems, subtotal, gst, deliveryFee, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
