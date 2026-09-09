import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, StyleSheet } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { categories } from '../../data/mock';
import { fetchRestaurants, fetchMenuItems } from '../../lib/data';
import SearchBar from '../../components/SearchBar';
import { searchCatalog } from '../../lib/business';
import RestaurantCard from '../../components/RestaurantCard';
import MenuItemCard from '../../components/MenuItemCard';
import { useCart } from '../../context/CartContext';
import { Restaurant, MenuItem } from '../../types';

type FilterMode = 'all' | 'restaurant' | 'dish';

export default function RestaurantsScreen() {
  const [search, setSearch] = useState('');
  const [searchRestaurants, setSearchRestaurants] = useState<Restaurant[]>([]);
  const [searchDishes, setSearchDishes] = useState<MenuItem[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const { addItem } = useCart();
  const goToRestaurant = (id: string) => router.push(`/restaurant/${id}`);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const rs = await fetchRestaurants();
        setRestaurants(rs);
      } catch (e) {
        console.warn('Failed loading restaurants:', e);
      }
      try {
        const ms = await fetchMenuItems();
        setMenuItems(ms);
      } catch (e) {
        console.warn('Failed loading menu items:', e);
      }
    };
    load();
  }, []);

  const filteredRestaurants = useMemo(() => {
    let result = restaurants;
    if (selectedCuisine) {
      result = result.filter(r =>
        r.cuisine.toLowerCase() === selectedCuisine.toLowerCase() ||
        r.tags.some(t => t.toLowerCase() === selectedCuisine.toLowerCase())
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, selectedCuisine]);

  const filteredDishes = useMemo(() => {
    let result = menuItems;
    if (selectedCuisine) {
      const restaurantIds = restaurants
        .filter(
          r =>
            r.cuisine.toLowerCase() === selectedCuisine.toLowerCase() ||
            r.tags.some(t => t.toLowerCase() === selectedCuisine.toLowerCase())
        )
        .map(r => r.id);
      result = result.filter(m => restaurantIds.includes(m.restaurantId));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedCuisine]);

  // When search is present, use Supabase-backed search
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!search || search.trim().length === 0) return;
      try {
        const res = await searchCatalog(search.trim());
        if (!mounted) return;
        setSearchRestaurants((res.restaurants || []).map((r: any) => ({ id: r.id, name: r.name, cuisine: r.cuisine, rating: Number(r.rating || 0), reviewCount: r.review_count || 0, deliveryTime: r.delivery_time || '', deliveryFee: Number(r.delivery_fee || 0), priceRange: r.price_range || '', image: r.image || '', tags: r.tags || [], featured: r.featured || false, city: r.city || ''})));
        setSearchDishes((res.dishes || []).map((d: any) => ({ id: d.id, restaurantId: d.restaurant_id, name: d.name, description: d.description, price: Number(d.price || 0), image: d.image || '', category: d.category || '', popular: d.popular || false })));
      } catch (e) {
        console.warn('Search failed:', e);
      }
    };
    const t = setTimeout(run, 300);
    return () => { mounted = false; clearTimeout(t); };
  }, [search]);

  const cuisineFilters = ['All', ...new Set(restaurants.map(r => r.cuisine))];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse</Text>
        <Pressable style={styles.filterButton}>
          <SlidersHorizontal size={18} color={Colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search restaurants & dishes..." />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'restaurant', 'dish'] as FilterMode[]).map(mode => (
          <Pressable
            key={mode}
            style={[styles.filterTab, filterMode === mode && styles.filterTabActive]}
            onPress={() => setFilterMode(mode)}>
            <Text
              style={[styles.filterTabText, filterMode === mode && styles.filterTabTextActive]}>
              {mode === 'all' ? 'All' : mode === 'restaurant' ? 'Restaurants' : 'Dishes'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Cuisine Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineScroll}>
        <View style={styles.cuisineRow}>
          {cuisineFilters.map(c => (
            <Pressable
              key={c}
              style={[
                styles.cuisineChip,
                (c === 'All' ? !selectedCuisine : selectedCuisine === c) &&
                  styles.cuisineChipActive,
              ]}
              onPress={() => setSelectedCuisine(c === 'All' ? null : c)}>
              <Text
                style={[
                  styles.cuisineChipText,
                  (c === 'All' ? !selectedCuisine : selectedCuisine === c) &&
                    styles.cuisineChipTextActive,
                ]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {(filterMode === 'all' || filterMode === 'restaurant') &&
          (search.trim().length > 0 ? searchRestaurants : filteredRestaurants).map(r => <RestaurantCard key={r.id} restaurant={r} onPress={goToRestaurant} />)}

        {(filterMode === 'all' || filterMode === 'dish') &&
          (search.trim().length > 0 ? searchDishes : filteredDishes).map(m => <MenuItemCard key={m.id} item={m} onAdd={addItem} />)}

        {filteredRestaurants.length === 0 && filteredDishes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
          </View>
        )}
      </ScrollView>
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
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: Colors.primary[500],
  },
  filterTabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  cuisineScroll: {
    marginBottom: Spacing.md,
  },
  cuisineRow: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cuisineChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  cuisineChipActive: {
    backgroundColor: Colors.primary[100],
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  cuisineChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  cuisineChipTextActive: {
    color: Colors.primary[700],
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
});
