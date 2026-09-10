import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { ArrowLeft, Clock, ShoppingBag, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getCustomerOrders } from '../../lib/business';

export default function OrderHistoryScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getCustomerOrders(user!.id);
      setOrders(data);
    } catch (e) {
      console.error("Error loading customer past orders:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Fetching order history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={54} color={Colors.neutral[300]} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No past orders found</Text>
            <Text style={styles.emptySubtitle}>When you place orders, they will appear here with active status updates.</Text>
            <Pressable style={styles.browseBtn} onPress={() => router.replace('/(tabs)/restaurants')}>
              <Text style={styles.browseText}>Browse Restaurants</Text>
            </Pressable>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, styles[`status_${order.status}` as keyof typeof styles] as any]}>
                  <Text style={[styles.statusText, styles[`statusText_${order.status}` as keyof typeof styles] as any]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Items List */}
              <View style={styles.cardItems}>
                {order.items.map((item: any, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.orderRefRow}>
                  <Clock size={12} color={Colors.neutral[400]} style={{ marginRight: 4 }} />
                  <Text style={styles.orderRefText}>ID: {order.id.toUpperCase()}</Text>
                </View>
                <View style={styles.deliveryMeta}>
                  {order.address ? (
                    <View style={styles.deliveryAddressRow}>
                      <MapPin size={12} color={Colors.primary[500]} style={{ marginRight: 4 }} />
                      <Text style={styles.deliveryAddressText} numberOfLines={2}>{order.address}</Text>
                    </View>
                  ) : (
                    <Text style={styles.deliveryAddressText}>Delivery address not saved</Text>
                  )}
                  <Text style={styles.totalText}>
                    Paid: <Text style={styles.totalAmount}>₹{order.totalPrice}</Text>
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontFamily: 'Inter-Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  orderCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  restaurantName: {
    fontSize: FontSizes.md + 1,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  orderDate: {
    fontSize: FontSizes.xs + 1,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  status_pending: {
    backgroundColor: '#FEF3C7',
  },
  status_preparing: {
    backgroundColor: '#DBEAFE',
  },
  status_ready: {
    backgroundColor: '#D1FAE5',
  },
  status_delivered: {
    backgroundColor: Colors.neutral[100],
  },
  status_cancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  statusText_pending: {
    color: '#D97706',
  },
  statusText_preparing: {
    color: '#2563EB',
  },
  statusText_ready: {
    color: '#059669',
  },
  statusText_delivered: {
    color: Colors.neutral[500],
  },
  statusText_cancelled: {
    color: Colors.error,
  },
  cardItems: {
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemQuantity: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary[500],
    fontFamily: 'Inter-Bold',
    width: 25,
  },
  itemName: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  itemPrice: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryMeta: {
    alignItems: 'flex-end',
    maxWidth: '58%',
  },
  deliveryAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deliveryAddressText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'right',
  },
  orderRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderRefText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  totalText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  totalAmount: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.primary[600],
    fontFamily: 'Inter-Bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.neutral[600],
    fontFamily: 'Inter-Bold',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[400],
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    fontFamily: 'Inter-Regular',
  },
  browseBtn: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  browseText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});
