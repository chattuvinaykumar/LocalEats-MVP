import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { CartItem } from '../types';

interface CartItemRowProps {
  item: CartItem;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export default function CartItemRow({ item, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
  const total = item.menuItem.price * item.quantity;

  return (
    <View style={styles.row}>
      <Image source={{ uri: item.menuItem.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.menuItem.name}</Text>
        <Text style={styles.price}>₹{total}</Text>
      </View>
      <View style={styles.quantityControls}>
        <Pressable style={styles.quantityButton} onPress={() => onDecrement?.(item.menuItem.id)}>
          <Minus size={14} color={Colors.textSecondary} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Pressable style={styles.quantityButton} onPress={() => onIncrement?.(item.menuItem.id)}>
          <Plus size={14} color={Colors.primary[600]} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    resizeMode: 'cover',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  price: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
    minWidth: 20,
    textAlign: 'center',
  },
});
