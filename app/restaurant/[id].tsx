import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { ArrowLeft, Star, Clock, MapPin, DollarSign, Minus, Plus, ShoppingBag } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { restaurants, menuItems } from '../../data/mock';
import { useCart } from '../../context/CartContext';
import { MenuItem } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = restaurants.find(r => r.id === id);
  const items = menuItems.filter(m => m.restaurantId === id);
  const { addItem, totalItems } = useCart();

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))];
    return cats;
  }, [items]);

  const [activeCategory, setActiveCategory] = useState<string | categories[0]>(
    categories[0] ?? ''
  );

  const filteredItems = useMemo(
    () => (activeCategory ? items.filter(i => i.category === activeCategory) : items),
    [items, activeCategory]
  );

  if (!restaurant) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Restaurant not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.emptyLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const priceDollarCount = restaurant.priceRange.length;

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.banner} />
          <View style={styles.bannerOverlay} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoCard}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#fff" fill="#fff" strokeWidth={0} />
              <Text style={styles.ratingText}>{restaurant.rating}</Text>
            </View>
            <Text style={styles.reviewCount}>({restaurant.reviewCount} reviews)</Text>
            <View style={styles.dot} />
            <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.metaText}>{restaurant.deliveryTime} min</Text>
            <View style={styles.dot} />
            <MapPin size={14} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.metaText}>{restaurant.cuisine}</Text>
          </View>
          <View style={styles.priceRow}>
            <View style={styles.priceRange}>
              {[1, 2, 3].map(i => (
                <DollarSign
                  key={i}
                  size={14}
                  strokeWidth={2.5}
                  color={i <= priceDollarCount ? Colors.primary[500] : Colors.neutral[300]}
                />
              ))}
            </View>
            <Text style={styles.deliveryFee}>
              Delivery: ₹{restaurant.deliveryFee}
            </Text>
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}>
          {categories.map(cat => (
            <Pressable
              key={cat}
              style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat)}>
              <Text
                style={[
                  styles.categoryTabText,
                  activeCategory === cat && styles.categoryTabTextActive,
                ]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {filteredItems.map(item => (
            <MenuCard key={item.id} item={item} onAdd={addItem} />
          ))}
          {filteredItems.length === 0 && (
            <View style={styles.emptyMenu}>
              <Text style={styles.emptyMenuText}>No items in this category</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <Pressable style={styles.cartBar} onPress={() => router.push('/(tabs)/cart')}>
          <ShoppingBag size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.cartBarText}>{totalItems} items in cart</Text>
          <Text style={styles.cartBarAction}>View cart</Text>
        </Pressable>
      )}
    </View>
  );
}

function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  const [qty, setQty] = useState(0);

  const handleAdd = () => {
    onAdd(item);
    setQty(prev => prev + 1);
  };

  return (
    <View style={styles.menuCard}>
      <View style={styles.menuInfo}>
        {item.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
        <Text style={styles.menuName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.menuDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.menuPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.menuImageContainer}>
        <Image source={{ uri: item.image }} style={styles.menuImage} />
        {qty === 0 ? (
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Plus size={18} color="#fff" strokeWidth={3} />
          </Pressable>
        ) : (
          <View style={styles.qtyRow}>
            <Pressable
              style={styles.qtyButton}
              onPress={() => setQty(prev => Math.max(0, prev - 1))}>
              <Minus size={14} color={Colors.text} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.qtyText}>{qty}</Text>
            <Pressable style={styles.qtyButton} onPress={handleAdd}>
              <Plus size={14} color={Colors.primary[600]} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.sm,
  },
  emptyLink: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary[500],
    fontFamily: 'Inter-SemiBold',
  },
  bannerContainer: {
    position: 'relative',
  },
  banner: {
    width: SCREEN_WIDTH,
    height: 220,
    resizeMode: 'cover',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginTop: -Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  name: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  ratingText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  reviewCount: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.neutral[300],
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryFee: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  categoryScroll: {
    marginVertical: Spacing.md,
  },
  categoryContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  categoryTabActive: {
    backgroundColor: Colors.primary[500],
  },
  categoryTabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  menuSection: {
    paddingHorizontal: Spacing.lg,
  },
  menuCard: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuInfo: {
    flex: 1,
    marginRight: Spacing.md,
    justifyContent: 'center',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  popularText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.primary[600],
    fontFamily: 'Inter-SemiBold',
  },
  menuName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 3,
  },
  menuDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  menuPrice: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  menuImageContainer: {
    position: 'relative',
  },
  menuImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
  },
  addButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  qtyRow: {
    position: 'absolute',
    bottom: -8,
    right: -14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xs,
    gap: 4,
    ...Shadows.sm,
  },
  qtyButton: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    minWidth: 16,
    textAlign: 'center',
  },
  emptyMenu: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyMenuText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  bottomSpacer: {
    height: 100,
  },
  cartBar: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  cartBarText: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
  },
  cartBarAction: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
});
