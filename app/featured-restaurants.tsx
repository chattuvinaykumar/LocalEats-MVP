import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { restaurants } from '../data/mock';
import RestaurantCard from '../components/RestaurantCard';
import { useLocation } from '../context/LocationContext';

export default function FeaturedRestaurantsScreen() {
  const { city } = useLocation();

  const featured = useMemo(() => {
    const filtered = restaurants.filter(r => r.featured && r.city === city);
    return filtered.length > 0
      ? filtered
      : restaurants.filter(r => r.featured);
  }, [city]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Sparkles size={20} color={Colors.primary[500]} strokeWidth={2} />
            <Text style={styles.headerTitle}>Featured Restaurants</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.list}>
          {featured.map(r => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              onPress={id => router.push(`/restaurant/${id}`)}
            />
          ))}
        </View>
        <View style={styles.spacer} />
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
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  spacer: {
    height: Spacing.xl,
  },
});
