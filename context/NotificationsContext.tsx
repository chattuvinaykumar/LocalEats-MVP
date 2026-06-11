import React, { createContext, useContext, useState } from 'react';

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
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);

  const addNotification = (title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [notification, ...prev]);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
