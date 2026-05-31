import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Star, Clock } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/theme';
import { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: (id: string) => void;
  compact?: boolean;
}

export default function RestaurantCard({ restaurant, onPress, compact }: RestaurantCardProps) {
  return (
    <Pressable
      style={[styles.card, compact && styles.compactCard]}
      onPress={() => onPress?.(restaurant.id)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.image }} style={[styles.image, compact && styles.compactImage]} />
        {restaurant.featured && !compact && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <View style={styles.imageOverlay} />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
          <Text style={styles.priceRange}>{restaurant.priceRange}</Text>
        </View>
        <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
        <View style={styles.meta}>
          <View style={styles.ratingBadge}>
            <Star size={11} color="#fff" fill="#fff" strokeWidth={0} />
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
          </View>
          <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
          <View style={styles.dot} />
          <View style={styles.deliveryRow}>
            <Clock size={13} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.deliveryText}>{restaurant.deliveryTime} min</Text>
          </View>
          <Text style={styles.deliveryFeeText}>₹{restaurant.deliveryFee}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  compactCard: {
    width: 240,
    marginBottom: 0,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  compactImage: {
    height: 130,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  featuredText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  info: {
    padding: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginRight: Spacing.sm,
  },
  priceRange: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary[600],
    fontFamily: 'Inter-SemiBold',
  },
  cuisine: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  reviewCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.neutral[300],
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  deliveryText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  deliveryFeeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
});
