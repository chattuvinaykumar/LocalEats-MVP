import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import {
  User,
  MapPin,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Heart,
  Clock,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';

interface ProfileMenuItem {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  destructive?: boolean;
}

const menuItems: ProfileMenuItem[] = [
  {
    icon: <MapPin size={20} color={Colors.text} strokeWidth={2} />,
    label: 'Delivery addresses',
    subtitle: '123 Main Street',
  },
  {
    icon: <CreditCard size={20} color={Colors.text} strokeWidth={2} />,
    label: 'Payment methods',
    subtitle: 'Visa ****4242',
  },
  {
    icon: <Clock size={20} color={Colors.text} strokeWidth={2} />,
    label: 'Order history',
    subtitle: '12 past orders',
  },
  {
    icon: <Heart size={20} color={Colors.text} strokeWidth={2} />,
    label: 'Favorites',
    subtitle: '8 restaurants',
  },
  {
    icon: <Settings size={20} color={Colors.text} strokeWidth={2} />,
    label: 'Preferences',
  },
  {
    icon: <HelpCircle size={20} color={Colors.text} strokeWidth={2} />,
    label: 'Help & Support',
  },
  {
    icon: <LogOut size={20} color={Colors.error} strokeWidth={2} />,
    label: 'Sign out',
    destructive: true,
  },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={36} color={Colors.primary[500]} strokeWidth={1.5} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Alex Johnson</Text>
          <Text style={styles.profileEmail}>alex.johnson@email.com</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>$24</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.label}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, item.destructive && styles.menuIconDestructive]}>
                {item.icon}
              </View>
              <View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.destructive && styles.menuLabelDestructive,
                  ]}>
                  {item.label}
                </Text>
                {item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <ChevronRight
              size={18}
              color={item.destructive ? Colors.error : Colors.neutral[300]}
              strokeWidth={2}
            />
          </Pressable>
        ))}
      </View>

      <Text style={styles.versionText}>LocalEats v1.0.0</Text>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  profileEmail: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.lg,
    marginTop: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  menuSection: {
    backgroundColor: Colors.background,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDestructive: {
    backgroundColor: '#FEF2F2',
  },
  menuLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
  },
  menuLabelDestructive: {
    color: Colors.error,
  },
  menuSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
  versionText: {
    textAlign: 'center',
    fontSize: FontSizes.sm,
    color: Colors.neutral[400],
    fontFamily: 'Inter-Regular',
    marginTop: Spacing.xxl,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
