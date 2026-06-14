import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Order delivered successfully',
    message: 'Your order from Paradise Biryani has been delivered',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    title: '20% off on Biryani this weekend',
    message: 'Get special discounts on all biryani orders',
    timestamp: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    title: 'Free delivery available in your area',
    message: 'Free delivery on orders above ₹199',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '4',
    title: 'Welcome to LocalEats',
    message: 'Start ordering from your favorite restaurants',
    timestamp: '3 days ago',
    read: true,
  },
  {
    id: '5',
    title: 'New restaurants added near you',
    message: 'Check out 5 new restaurants in your area',
    timestamp: '1 week ago',
    read: true,
  },
];

const STORAGE_KEY = 'localeats_notifications';

interface NotificationsContextValue {
  notifications: Notification[];
  addNotification: (title: string, message: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function safeLoad(): Notification[] | null {
  if (typeof window === 'undefined' || !('localStorage' in window)) return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Notification[];
    if (!Array.isArray(parsed)) return null;
    // Dedupe by id while preserving order (first occurrence wins)
    const seen = new Set<string>();
    const unique: Notification[] = [];
    for (const n of parsed) {
      if (!n || !n.id) continue;
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      unique.push(n);
    }
    return unique;
  } catch (e) {
    console.warn('Failed to parse stored notifications', e);
    return null;
  }
}

function persist(list: Notification[]) {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to persist notifications', e);
  }
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const loaded = safeLoad();
    return loaded !== null ? loaded : DEFAULT_NOTIFICATIONS;
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // Load stored notifications or initialize defaults
  useEffect(() => {
    const loaded = safeLoad();
    if (loaded !== null) {
      setNotifications(loaded);
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      persist(DEFAULT_NOTIFICATIONS);
    }
    setIsHydrated(true);
  }, []);

  // Persist whenever notifications change after hydration
  useEffect(() => {
    if (!isHydrated) return;
    persist(notifications);
  }, [notifications, isHydrated]);

  const addNotification = (title: string, message: string) => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      title,
      message,
      timestamp: 'Just now',
      read: false,
    };

    setNotifications(prev => {
      if (prev.find(p => p.id === notification.id)) return prev;
      return [notification, ...prev];
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAsRead, clearAll, deleteNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
