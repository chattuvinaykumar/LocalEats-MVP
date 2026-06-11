import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { menuItems } from '../data/mock';
import MenuItemCard from '../components/MenuItemCard';
import { useCart } from '../context/CartContext';

export default function TrendingDishesScreen() {
  const { addItem } = useCart();
  const trendingDishes = menuItems.filter(m => m.popular);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TrendingUp size={20} color={Colors.primary[500]} strokeWidth={2} />
            <Text style={styles.headerTitle}>Trending Dishes</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.grid}>
          {trendingDishes.map(item => (
            <View key={item.id} style={styles.gridItem}>
              <MenuItemCard item={item} onAdd={addItem} />
            </View>
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
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  gridItem: {
    marginBottom: Spacing.sm,
  },
  spacer: {
    height: Spacing.xl,
  },
});
