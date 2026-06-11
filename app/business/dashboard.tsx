import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { 
  ArrowLeft, Store, ShieldCheck, Tag, ShoppingBag, 
  Settings, ChefHat, Plus, TrendingUp, Star, Play, Check, Trash2, Clock 
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { 
  getOwnedRestaurant, 
  getBusinessOrders, 
  getBusinessMenuItems, 
  updateBusinessOrderStatus, 
  addSimulatedOrder, 
  MerchantOrder 
} from '../../lib/business';
import { Restaurant, MenuItem } from '../../types';

type DashboardTab = 'orders' | 'settings';

export default function BusinessDashboardScreen() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const rest = await getOwnedRestaurant(user.id);
      if (!rest) {
        // Not registered yet! Redirect to registration
        router.replace('/business/register');
        return;
      }
      setRestaurant(rest);

      const [loadedOrders, loadedMenu] = await Promise.all([
        getBusinessOrders(rest.id),
        getBusinessMenuItems(rest.id)
      ]);

      setOrders(loadedOrders);
      setMenuItems(loadedMenu);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: MerchantOrder['status']) => {
    if (!restaurant) return;
    try {
      const updated = await updateBusinessOrderStatus(restaurant.id, orderId, status);
      setOrders(updated);
    } catch (e) {
      Alert.alert('Error', 'Unable to update status.');
    }
  };

  const handleSimulateOrder = async () => {
    if (!restaurant) return;
    setSimulating(true);
    try {
      const updated = await addSimulatedOrder(restaurant.id);
      setOrders(updated);
      Alert.alert('New Order Received!', 'Simulated incoming customer order has been pushed to your queue.');
    } catch (e) {
      Alert.alert('Simulation Failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Synchronizing Merchant Portal...</Text>
      </View>
    );
  }

  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').length;
  const totalRevenue = orders.reduce((sum, o) => o.status === 'delivered' ? sum + o.totalPrice : sum, 0);

  return (
    <View style={styles.container}>
      {/* Top Banner & Header */}
      <View style={styles.heroBanner}>
        {restaurant?.image && (
          <Image source={{ uri: restaurant.image }} style={styles.bannerImage} />
        )}
        <View style={styles.overlay} />
        
        <View style={styles.headerRow}>
          <Pressable style={styles.circleBtn} onPress={() => router.replace('/(tabs)/profile')}>
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <View style={styles.badgeRow}>
            <View style={styles.merchantBadge}>
              <ShieldCheck size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.merchantBadgeText}>Verified Partner</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSummary}>
          <Text style={styles.restaurantName}>{restaurant?.name}</Text>
          <Text style={styles.restaurantMeta}>
            {restaurant?.cuisine} • {restaurant?.city}
          </Text>
        </View>
      </View>

      {/* Metrics Bento Row */}
      <View style={styles.metricsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <TrendingUp size={20} color={Colors.primary[500]} />
            <Text style={styles.metricValue}>₹{totalRevenue}</Text>
            <Text style={styles.metricLabel}>{"Today's Earnings"}</Text>
          </View>

          <View style={styles.metricCard}>
            <ShoppingBag size={20} color="#3B82F6" />
            <Text style={styles.metricValue}>{activeOrdersCount}</Text>
            <Text style={styles.metricLabel}>New Orders</Text>
          </View>

          <View style={styles.metricCard}>
            <ChefHat size={20} color="#10B981" />
            <Text style={styles.metricValue}>{menuItems.length}</Text>
            <Text style={styles.metricLabel}>Menu Items</Text>
          </View>

          <View style={styles.metricCard}>
            <Star size={20} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.metricValue}>{restaurant?.rating.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Store Feedback</Text>
          </View>
        </ScrollView>
      </View>

      {/* Management Quick Navigation Bar */}
      <View style={styles.navigationRow}>
        <Pressable 
          style={[styles.navItem, activeTab === 'orders' && styles.navItemActive]}
          onPress={() => setActiveTab('orders')}>
          <Text style={[styles.navText, activeTab === 'orders' && styles.navTextActive]}>Active Orders ({activeOrdersCount})</Text>
        </Pressable>
        <Pressable 
          style={styles.navItemSpecial}
          onPress={() => router.push('/business/manage-menu')}>
          <ChefHat size={16} color={Colors.primary[500]} style={{ marginRight: 6 }} />
          <Text style={styles.navTextSpecial}>Manage Menu</Text>
        </Pressable>
        <Pressable 
          style={[styles.navItem, activeTab === 'settings' && styles.navItemActive]}
          onPress={() => setActiveTab('settings')}>
          <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Details</Text>
        </Pressable>
      </View>

      {/* Active Area */}
      {activeTab === 'orders' && (
        <View style={styles.scrollContainer}>
          {/* Simulation Header */}
          <View style={styles.ordersHeader}>
            <Text style={styles.sectionHeading}>Customer Queue</Text>
            <Pressable 
              style={[styles.simulateBtn, simulating && { opacity: 0.7 }]} 
              onPress={handleSimulateOrder}
              disabled={simulating}>
              <Play size={14} color="#fff" fill="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.simulateBtnText}>Simulate Order</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ShoppingBag size={48} color={Colors.neutral[300]} strokeWidth={1} />
                <Text style={styles.emptyTitle}>Order Queue is Empty</Text>
                <Text style={styles.emptySubtitle}>{"Click \"Simulate Order\" above to generate a custom mock customer ticket instantly!"}</Text>
              </View>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={styles.orderTicket}>
                  {/* Title Bar */}
                  <View style={styles.ticketHeader}>
                    <View>
                      <Text style={styles.ticketId}>{order.id.toUpperCase()}</Text>
                      <Text style={styles.ticketTime}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={[styles.statusTag, (styles as any)[`status_${order.status}`]]}>
                      <Text style={[styles.statusTextTag, (styles as any)[`statusText_${order.status}`]]}>
                        {order.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Body items */}
                  <View style={styles.ticketBody}>
                    <Text style={styles.customerName}>For: {order.customerName}</Text>
                    {order.items.map((i, k) => (
                      <View key={k} style={styles.itemRow}>
                        <Text style={styles.itemQuants}>{i.quantity}x</Text>
                        <Text style={styles.itemName}>{i.name}</Text>
                        <Text style={styles.itemPrice}>₹{i.price * i.quantity}</Text>
                      </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Grand Total</Text>
                      <Text style={styles.totalValue}>₹{order.totalPrice}</Text>
                    </View>

                    {/* Integrated Payment Status Block */}
                    <View style={styles.paymentInfoRow}>
                      <Text style={styles.paymentLabel}>Payment Details:</Text>
                      <View style={styles.paymentBadgeWrapper}>
                        <View style={[
                          styles.statusTagDot,
                          { backgroundColor: order.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' }
                        ]} />
                        <Text style={[
                          styles.paymentVal,
                          { color: order.paymentStatus === 'paid' ? '#059669' : '#D97706' }
                        ]}>
                          {order.paymentStatus === 'paid' ? 'PAID' : 'PENDING'} ({order.paymentMethod || 'COD'})
                        </Text>
                      </View>
                    </View>
                    {order.paymentStatus === 'paid' && order.transactionId && (
                      <Text style={styles.txIdLabel}>
                        TxID: {order.transactionId}
                      </Text>
                    )}
                  </View>

                  {/* Action states buttons */}
                  {order.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <Pressable 
                        style={[styles.actionBtn, styles.declineBtn]}
                        onPress={() => handleUpdateStatus(order.id, 'cancelled')}>
                        <Text style={styles.declineText}>Decline</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.actionBtn, styles.acceptBtn]}
                        onPress={() => handleUpdateStatus(order.id, 'preparing')}>
                        <Text style={styles.acceptText}>Accept & Prep</Text>
                      </Pressable>
                    </View>
                  )}

                  {order.status === 'preparing' && (
                    <Pressable 
                      style={[styles.actionBtnFull, styles.prepBtn]}
                      onPress={() => handleUpdateStatus(order.id, 'ready')}>
                      <Check size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnFullText}>Mark as Ready</Text>
                    </Pressable>
                  )}

                  {order.status === 'ready' && (
                    <Pressable 
                      style={[styles.actionBtnFull, styles.deliverBtn]}
                      onPress={() => handleUpdateStatus(order.id, 'delivered')}>
                      <Clock size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnFullText}>Dispatched / Delivered</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </View>
      )}

      {activeTab === 'settings' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsContent}>
          <Text style={styles.sectionHeading}>Business Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Official Store Name</Text>
              <Text style={styles.detailVal}>{restaurant?.name}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cuisine Category</Text>
              <Text style={styles.detailVal}>{restaurant?.cuisine}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Base Delivery Fee</Text>
              <Text style={styles.detailVal}>₹{restaurant?.deliveryFee}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Average Preparation & Shipping</Text>
              <Text style={styles.detailVal}>{restaurant?.deliveryTime} minutes</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pricing Tier</Text>
              <Text style={styles.detailVal}>{restaurant?.priceRange}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Operating Headquarter</Text>
              <Text style={styles.detailVal}>{restaurant?.city}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Search Tags</Text>
              <View style={styles.tagsContainer}>
                {restaurant?.tags.map(t => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Pressable 
            style={[styles.editBtn, { marginBottom: Spacing.md, backgroundColor: '#10B981' }]}
            onPress={() => router.push('/business/manage-offers')}>
            <Tag size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.editBtnText}>Manage Promotions & Offers</Text>
          </Pressable>

          <Pressable 
            style={styles.editBtn}
            onPress={() => router.push('/business/register')}>
            <Settings size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.editBtnText}>Update Store Profile</Text>
          </Pressable>
        </ScrollView>
      )}
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Medium',
    marginTop: Spacing.md,
  },
  heroBanner: {
    height: 180,
    position: 'relative',
    backgroundColor: Colors.neutral[900],
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  headerRow: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  merchantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  merchantBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  infoSummary: {
    marginTop: 'auto',
  },
  restaurantName: {
    fontSize: FontSizes.xl + 2,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  restaurantMeta: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  metricsWrapper: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metricsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  metricCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  metricValue: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  navigationRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  navItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  navItemActive: {
    borderBottomColor: Colors.primary[500],
  },
  navText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.neutral[500],
    fontFamily: 'Inter-SemiBold',
  },
  navTextActive: {
    color: Colors.primary[500],
  },
  navItemSpecial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.2,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.primary[50],
    marginHorizontal: Spacing.xs,
  },
  navTextSpecial: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary[600],
    fontFamily: 'Inter-Bold',
  },
  scrollContainer: {
    flex: 1,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: FontSizes.md + 1,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  simulateBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  orderTicket: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  ticketHeader: {
    backgroundColor: Colors.neutral[50],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ticketId: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  ticketTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
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
  statusTextTag: {
    fontSize: 10,
    fontWeight: '700',
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
  ticketBody: {
    padding: Spacing.md,
  },
  customerName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  itemQuants: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary[500],
    width: 28,
  },
  itemName: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.primary[600],
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  paymentLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  paymentBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  paymentVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  txIdLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.neutral[400],
    marginTop: 2,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#FFF5F5',
  },
  declineText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
  acceptBtn: {
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  acceptText: {
    color: Colors.primary[600],
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
  actionBtnFull: {
    width: '100%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  prepBtn: {
    backgroundColor: '#3B82F6',
  },
  deliverBtn: {
    backgroundColor: '#10B981',
  },
  actionBtnFullText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.neutral[600],
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[400],
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  settingsContent: {
    padding: Spacing.lg,
  },
  detailsCard: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  detailItem: {
    marginBottom: Spacing.md,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.neutral[400],
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  detailVal: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontFamily: 'Inter-Medium',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 11,
    color: Colors.neutral[600],
  },
  editBtn: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
});
