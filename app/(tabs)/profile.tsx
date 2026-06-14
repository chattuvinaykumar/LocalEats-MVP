import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Heart,
  Clock,
  LogIn,
  Briefcase,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { getCustomerOrders } from '../../lib/business';

interface ProfileMenuItem {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  destructive?: boolean;
  route?: string;
  requiresAuth?: boolean;
  authAlertMessage?: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);

  useEffect(() => {
    if (user) {
      getCustomerOrders(user.id)
        .then(orders => {
          setOrderCount(orders.length);
          setTotalSpent(orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0));
        })
        .catch(err => {
          console.warn("Error getting order count:", err);
          setOrderCount(0);
          setTotalSpent(0);
        });

      if (typeof window !== 'undefined') {
        const savedFavorites = window.localStorage.getItem('localeats_saved_favorites');
        if (savedFavorites) {
          try {
            const parsed = JSON.parse(savedFavorites);
            setFavoritesCount(Array.isArray(parsed) ? parsed.length : Number(parsed) || 0);
          } catch {
            setFavoritesCount(0);
          }
        } else {
          setFavoritesCount(0);
        }
      }
    } else {
      setOrderCount(null);
      setFavoritesCount(0);
      setTotalSpent(0);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleMenuPress = (item: ProfileMenuItem) => {
    if (item.label === 'Sign out') {
      handleSignOut();
      return;
    }

    if (item.requiresAuth && !user) {
      Alert.alert(
        'Authentication required',
        item.authAlertMessage ?? 'Please sign in to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }

    if (item.route) {
      router.push(item.route as any);
    }
  };

  const dynamicMenuItems: ProfileMenuItem[] = [
    {
      icon: <Briefcase size={20} color={Colors.text} strokeWidth={2} />,
      label: 'Merchant Portal',
      subtitle: 'Register or manage restaurant',
      route: '/business/dashboard',
      requiresAuth: true,
      authAlertMessage: 'Please register or sign in to access the merchant portal.',
    },
    {
      icon: <MapPin size={20} color={Colors.text} strokeWidth={2} />,
      label: 'Delivery addresses',
      subtitle: 'Manage your saved addresses',
      route: '/delivery-addresses',
    },
    {
      icon: <CreditCard size={20} color={Colors.text} strokeWidth={2} />,
      label: 'Payment methods',
      subtitle: 'Manage your saved payment methods',
      route: '/payment-methods',
    },
    {
      icon: <Clock size={20} color={Colors.text} strokeWidth={2} />,
      label: 'Order history',
      subtitle: orderCount !== null ? `${orderCount} past ${orderCount === 1 ? 'order' : 'orders'}` : 'past orders',
      route: '/orders/history',
    },
    {
      icon: <Heart size={20} color={Colors.text} strokeWidth={2} />,
      label: 'Favorites',
      subtitle: favoritesCount > 0 ? `${favoritesCount} restaurants` : 'View saved favorites',
      route: '/favorites',
    },
    {
      icon: <Settings size={20} color={Colors.text} strokeWidth={2} />,
      label: 'Preferences',
      route: '/preferences',
    },
    {
      icon: <HelpCircle size={20} color={Colors.text} strokeWidth={2} />,
      label: 'Help & Support',
      route: '/help-support',
    },
    {
      icon: <LogOut size={20} color={Colors.error} strokeWidth={2} />,
      label: 'Sign out',
      destructive: true,
    },
  ];

  const filteredMenuItems = dynamicMenuItems.filter(item => {
    if (item.label === 'Sign out') return !!user;
    return true;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}>
        <Pressable onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
      </View>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={36} color={Colors.primary[500]} strokeWidth={1.5} />
        </View>
        {user ? (
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.user_metadata?.full_name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Guest User</Text>
            <Pressable onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Sign in to your account</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Auth Prompt for Guests */}
      {!user && (
        <View style={styles.authPrompt}>
          <View style={styles.authPromptContent}>
            <LogIn size={24} color={Colors.primary[500]} />
            <View style={styles.authPromptText}>
              <Text style={styles.authPromptTitle}>Unlock all features</Text>
              <Text style={styles.authPromptSubtitle}>Sign in to track orders and save favorites</Text>
            </View>
          </View>
          <Pressable style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Login / Signup</Text>
          </Pressable>
        </View>
      )}

      {/* Stats - Only show for authenticated users */}
      {user && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{orderCount ?? 0}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{favoritesCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{totalSpent}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>
      )}

      {/* Menu */}
      <View style={styles.menuSection}>
        {filteredMenuItems.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => handleMenuPress(item)}
            android_ripple={{ color: Colors.neutral[200] }}
            style={({ pressed }) => [
              styles.menuItem,
              index === filteredMenuItems.length - 1 && styles.menuItemLast,
              pressed && styles.menuItemPressed,
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
  topHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
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
  loginLink: {
    fontSize: FontSizes.md,
    color: Colors.primary[500],
    fontFamily: 'Inter-SemiBold',
    marginTop: 2,
  },
  authPrompt: {
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    ...Shadows.sm,
  },
  authPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  authPromptText: {
    flex: 1,
  },
  authPromptTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  authPromptSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  loginButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
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
  menuItemPressed: {
    backgroundColor: Colors.neutral[100],
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
