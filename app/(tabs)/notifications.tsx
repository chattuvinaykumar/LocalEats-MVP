import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';

const NOTIFICATIONS = [
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

export default function NotificationsScreen() {
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {NOTIFICATIONS.map(notif => (
          <View
            key={notif.id}
            style={[styles.notificationCard, !notif.read && styles.notificationCardUnread]}>
            <View style={styles.notificationIcon}>
              <Bell size={20} color={Colors.primary[500]} strokeWidth={2} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notif.title}</Text>
              <Text style={styles.notificationMessage}>{notif.message}</Text>
              <Text style={styles.notificationTime}>{notif.timestamp}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  content: {
    paddingVertical: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[50],
    gap: Spacing.md,
  },
  notificationCardUnread: {
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[500],
  },
  notificationIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 3,
  },
  notificationMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
});
