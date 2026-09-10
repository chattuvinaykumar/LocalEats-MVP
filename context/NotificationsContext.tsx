import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getNotifications, markNotificationRead as markNotificationReadServer } from '../lib/business';
import { supabase } from '../lib/supabase';

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

interface NotificationsContextValue {
  notifications: Notification[];
  addNotification: (title: string, message: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setNotifications(DEFAULT_NOTIFICATIONS);
        return;
      }

      try {
        const rows = await getNotifications(user.id);
        const mapped = (rows || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          timestamp: r.created_at || 'Just now',
          read: !!r.read
        }));
        setNotifications(mapped);
      } catch (e) {
        console.warn('Failed to fetch notifications from server:', e);
        setNotifications([]);
      }
    };

    init();

    let channel: any = null;
    if (user) {
      try {
        channel = supabase
          .channel(`public:notifications:user=${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
            try {
              const ev = payload.eventType;
              const record: any = payload.new || payload.old;
              if (ev === 'INSERT' && record) {
                const mapped = {
                  id: record.id,
                  title: record.title,
                  message: record.message,
                  timestamp: record.created_at || 'Just now',
                  read: !!record.read
                };
                setNotifications(prev => [mapped, ...prev]);
              } else if (ev === 'UPDATE' && record) {
                setNotifications(prev => prev.map(n => (n.id === record.id ? { ...n, title: record.title, message: record.message, read: !!record.read } : n)));
              } else if (ev === 'DELETE' && record) {
                setNotifications(prev => prev.filter(n => n.id !== record.id));
              }
            } catch (e) {
              console.warn('Realtime notification handler failed', e);
            }
          })
          .subscribe();
      } catch (e) {
        console.warn('Failed to setup realtime notifications subscription', e);
      }
    }

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) { console.warn('Failed to remove supabase channel', e); }
      }
    };
  }, [user]);

  const addNotification = (title: string, message: string) => {
    const id = Date.now().toString();
    const notification: Notification = { id, title, message, timestamp: 'Just now', read: false };

    setNotifications(prev => {
      if (prev.find(p => p.id === notification.id)) return prev;
      return [notification, ...prev];
    });

    (async () => {
      if (!user) return;
      try {
        await (await import('../lib/business')).createNotification?.(user.id, { id: `notif-${id}`, title, message, category: 'app', related_entity: null, related_id: null });
      } catch (e) {
        console.warn('Failed to persist notification to server', e);
      }
    })();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    if (user) {
      markNotificationReadServer(user.id, id).catch(e => console.warn('Failed to mark notification read on server', e));
    }
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
