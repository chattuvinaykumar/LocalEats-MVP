import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MapPin, Bell, TrendingUp, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { categories, promoBanners } from '../../data/mock';
import { fetchRestaurants, fetchMenuItems } from '../../lib/data';
import SearchBar from '../../components/SearchBar';
import SectionHeader from '../../components/SectionHeader';
import RestaurantCard from '../../components/RestaurantCard';
import MenuItemCard from '../../components/MenuItemCard';
import LocationSelectorModal from '../../components/LocationSelectorModal';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { getActiveOffersNearYou } from '../../lib/business';
import { Offer } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const { addItem } = useCart();
  const { city } = useLocation();
  const [activeOffers, setActiveOffers] = useState<(Offer & { restaurantName: string })[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    loadActiveOffers();
  }, [city]);

  useEffect(() => {
    const load = async () => {
      try {
        const rs = await fetchRestaurants();
        setRestaurants(rs);
      } catch (e) {
        console.warn('Failed fetching restaurants:', e);
      }
      try {
        const ms = await fetchMenuItems();
        setMenuItems(ms);
      } catch (e) {
        console.warn('Failed fetching menu items:', e);
      }
    };
    load();
  }, [city]);

  const loadActiveOffers = async () => {
    try {
      const data = await getActiveOffersNearYou();
      setActiveOffers(data);
    } catch (e) {
      console.warn("Error loading active offers near you:", e);
    }
  };

  const featured = restaurants.filter(r => r.featured && r.city === city).length > 0
    ? restaurants.filter(r => r.featured && r.city === city)
    : restaurants.filter(r => r.featured);

  const filteredPopular = selectedCategory
    ? restaurants
        .filter(r => r.city === city && r.tags.includes(selectedCategory) && r.rating >= 4.6)
        .sort((a, b) => b.rating - a.rating)
    : restaurants
        .filter(r => r.city === city && r.rating >= 4.6)
        .sort((a, b) => b.rating - a.rating);

  const popular = filteredPopular.length > 0
    ? filteredPopular
    : restaurants
        .filter(r => r.rating >= 4.6)
        .sort((a, b) => b.rating - a.rating);

  const popularDishes = menuItems.filter(m => m.popular);

  const goToRestaurant = (id: string) => router.push(`/restaurant/${id}`);
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good evening</Text>
          <Pressable style={styles.locationRow} onPress={() => setLocationModalVisible(true)}>
            <MapPin size={16} color={Colors.primary[500]} fill={Colors.primary[500]} />
            <Text style={styles.deliveryAddress}>{city}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.bellButton} onPress={() => router.push('/notifications')}>
          <Bell size={20} color={Colors.text} strokeWidth={2} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {/* Promo Banners */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bannerSection}
        contentContainerStyle={styles.bannerContent}
        pagingEnabled>
        {promoBanners.map(banner => (
          <Pressable key={banner.id} style={[styles.banner, { backgroundColor: banner.color }]}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
              <View style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Order now</Text>
              </View>
            </View>
            <Image source={{ uri: banner.image }} style={styles.bannerImage} />
          </Pressable>
        ))}
      </ScrollView>

      {/* Categories */}
      <View style={styles.section}>
        <SectionHeader title="Categories" />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All', icon: '🌟' }, ...categories]}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryItem,
                selectedCategory === item.id && styles.categoryItemSelected,
              ]}
              onPress={() => setSelectedCategory(item.id === 'all' ? null : item.id)}>
              <View
                style={[
                  styles.categoryCircle,
                  selectedCategory === item.id && styles.categoryCircleSelected,
                ]}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
              </View>
              <Text
                style={[
                  styles.categoryName,
                  selectedCategory === item.id && styles.categoryNameSelected,
                ]}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Offers Near You Section */}
      {activeOffers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelLeft}>
              <Text style={styles.discountBadgeVisual}>%</Text>
              <Text style={styles.sectionTitle}>Offers Near You</Text>
            </View>
            <View style={styles.sparkleRow}>
              <Sparkles size={12} color={Colors.primary[600]} />
              <Text style={styles.sparkleVal}>DEALS FOR YOU</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {activeOffers.map(offer => (
              <Pressable
                key={offer.id}
                style={styles.offerCard}
                onPress={() => goToRestaurant(offer.restaurantId)}>
                <Image source={{ uri: offer.bannerImage }} style={styles.offerCardImage} />
                <View style={styles.offerOverlay} />
                
                {/* Visual Discount Badge */}
                <View style={styles.offerBadge}>
                  <Text style={styles.offerBadgeText}>FLAT {offer.discountPercentage}% OFF</Text>
                </View>

                <View style={styles.offerTextContainer}>
                  <Text style={styles.offerRestaurantName}>{offer.restaurantName}</Text>
                  <Text style={styles.offerTitleText} numberOfLines={1}>{offer.title}</Text>
                  <Text style={styles.offerDesc} numberOfLines={1}>{offer.description}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured Restaurants */}
      <View style={styles.section}>
        <View style={styles.sectionLabelRow}>
          <View style={styles.sectionLabelLeft}>
            <Sparkles size={18} color={Colors.primary[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Featured</Text>
          </View>
          <Pressable onPress={() => router.push('/featured-restaurants')}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}>
          {featured.map(r => (
            <View key={r.id} style={styles.featuredCardWrapper}>
              <RestaurantCard restaurant={r} compact onPress={goToRestaurant} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Popular Restaurants */}
      <View style={styles.section}>
        <View style={styles.sectionLabelRow}>
          <View style={styles.sectionLabelLeft}>
            <TrendingUp size={18} color={Colors.primary[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Popular near you</Text>
          </View>
          <Pressable onPress={() => router.push('/popular-restaurants')}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>
        {popular.map(r => (
          <RestaurantCard key={r.id} restaurant={r} onPress={goToRestaurant} />
        ))}
      </View>

      {/* Popular Dishes */}
      <View style={styles.section}>
        <SectionHeader title="Trending dishes" actionText="See all" onAction={() => router.push('/trending-dishes')} />
        <View style={styles.dishesSection}>
          {popularDishes.slice(0, 4).map(item => (
            <MenuItemCard key={item.id} item={item} onAdd={addItem} />
          ))}
        </View>
      </View>

      <View style={styles.bottomSpacer} />

      <LocationSelectorModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </ScrollView>
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
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  deliveryAddress: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'Inter-SemiBold',
  },
  bellButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: Colors.neutral[100],
    marginTop: Spacing.xs,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
    borderWidth: 2,
    borderColor: Colors.background,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bannerSection: {
    marginVertical: Spacing.xs,
  },
  bannerContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  banner: {
    width: BANNER_WIDTH,
    height: 152,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  bannerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.md,
  },
  bannerButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  bannerImage: {
    width: 130,
    height: 152,
    resizeMode: 'cover',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  sectionAction: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary[500],
    fontFamily: 'Inter-SemiBold',
  },
  categoryList: {
    gap: Spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: 64,
  },
  categoryItemSelected: {
    opacity: 1,
  },
  categoryCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryCircleSelected: {
    backgroundColor: Colors.primary[500],
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: Colors.primary[600],
    fontWeight: '700',
  },
  horizontalList: {
    gap: Spacing.md,
  },
  featuredCardWrapper: {
    width: 240,
  },
  dishesSection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
  discountBadgeVisual: {
    backgroundColor: '#10B981',
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 6,
    overflow: 'hidden',
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  sparkleVal: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.primary[600],
    fontFamily: 'Inter-Bold',
    marginLeft: 3,
  },
  offerCard: {
    width: 240,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginRight: Spacing.xs,
    backgroundColor: Colors.neutral[900],
  },
  offerCardImage: {
    width: '100%',
    height: '100%',
  },
  offerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  offerBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    zIndex: 10,
  },
  offerBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs - 2,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
  },
  offerTextContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
  },
  offerRestaurantName: {
    fontSize: 8,
    color: Colors.primary[300],
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
  },
  offerTitleText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  offerDesc: {
    fontSize: FontSizes.xs - 2,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
});
