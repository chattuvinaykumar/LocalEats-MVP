import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ShoppingBag, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import CartItemRow from '../../components/CartItemRow';
import { useCart } from '../../context/CartContext';

export default function CartScreen() {
  const { items, incrementItem, decrementItem, removeItem, clearCart, subtotal, gst, deliveryFee, total, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <ShoppingBag size={48} color={Colors.neutral[300]} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items from restaurants to get started</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Text style={styles.headerCount}>{totalItems} items</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {items.map(item => (
          <CartItemRow
            key={item.menuItem.id}
            item={item}
            onIncrement={incrementItem}
            onDecrement={decrementItem}
            onRemove={removeItem}
          />
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST (5%)</Text>
          <Text style={styles.summaryValue}>₹{gst}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery fee</Text>
          <Text style={styles.summaryValue}>₹{deliveryFee}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total}</Text>
        </View>

        <Pressable style={styles.checkoutButton} onPress={() => router.push('/delivery-partner')}>
          <Text style={styles.checkoutText}>Place Order - ₹{total}</Text>
        </Pressable>

        <Pressable style={styles.clearButton} onPress={clearCart}>
          <Trash2 size={16} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.clearText}>Clear cart</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  headerCount: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  list: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  summary: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  summaryValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontFamily: 'Inter-Regular',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  totalValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  checkoutButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkoutText: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  clearButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  clearText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
