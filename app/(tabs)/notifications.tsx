import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useNotifications } from '../../context/NotificationsContext';

export default function NotificationsScreen() {
  const { notifications, markAsRead, clearAll } = useNotifications();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={clearAll} style={styles.headerAction}>
          <Text style={styles.headerActionText}>Clear all</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
            <Text style={styles.emptySubtext}>Any new updates will appear here.</Text>
          </View>
        ) : (
          notifications.map(notif => (
            <Pressable
              key={notif.id}
              style={[styles.notificationCard, !notif.read && styles.notificationCardUnread]}
              onPress={() => {
                markAsRead(notif.id);
                alert(`${notif.title}\n\n${notif.message}`);
              }}>
              <View style={styles.notificationIcon}>
                <Bell size={20} color={Colors.primary[500]} strokeWidth={2} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notif.title}</Text>
                <Text style={styles.notificationMessage}>{notif.message}</Text>
                <Text style={styles.notificationTime}>{notif.timestamp}</Text>
              </View>
            </Pressable>
          ))
        )}
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
  headerAction: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
  },
  headerActionText: {
    color: Colors.primary[600],
    fontSize: FontSizes.xs,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
