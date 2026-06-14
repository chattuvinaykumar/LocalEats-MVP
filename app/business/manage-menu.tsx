import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, ChefHat, Plus, Check, Trash2, Tag, Utensils, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getOwnedRestaurant, getBusinessMenuItems, saveBusinessMenuItem, deleteBusinessMenuItem } from '../../lib/business';
import { Restaurant, MenuItem } from '../../types';

const CATEGORIES = ['Biryani', 'North Indian', 'South Indian', 'Chinese', 'Desserts', 'Breads', 'Fast Food'];

export default function ManageMenuScreen() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [popular, setPopular] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadMenu();
  }, [user]);

  const loadMenu = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const rest = await getOwnedRestaurant(user.id);
      if (!rest) {
        Alert.alert('Error', 'Please register your business first.');
        router.replace('/business/register');
        return;
      }
      setRestaurant(rest);
      const loaded = await getBusinessMenuItems(rest.id);
      setMenuItems(loaded);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!restaurant) return;

    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a name for the dish.');
      return;
    }

    if (!price.trim() || isNaN(Number(price))) {
      Alert.alert('Required Field', 'Please enter a valid numeric price.');
      return;
    }

    try {
      const newItemId = `m-${Date.now()}`;
      
      // Auto-assign high-quality food background/illustration based on category
      let image = 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400';
      if (category.toLowerCase().includes('south')) {
        image = 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400';
      } else if (category.toLowerCase().includes('north') || category.toLowerCase().includes('bread')) {
        image = 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=400';
      } else if (category.toLowerCase().includes('dessert')) {
        image = 'https://images.pexels.com/photos/2915282/pexels-photo-2915282.jpeg?auto=compress&cs=tinysrgb&w=400';
      }

      const newItem: MenuItem = {
        id: newItemId,
        restaurantId: restaurant.id,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        image,
        category,
        popular
      };

      const updated = await saveBusinessMenuItem(restaurant.id, newItem);
      setMenuItems(updated);
      
      // Reset Form fields
      setName('');
      setDescription('');
      setPrice('');
      setPopular(false);
      setIsAdding(false);

      Alert.alert('Success', `${name} has been added to your menu successfully!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to add item to menu.');
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!restaurant) return;

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to remove ${itemName} from your menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await deleteBusinessMenuItem(restaurant.id, itemId);
              setMenuItems(updated);
            } catch (e) {
              Alert.alert('Error', 'Could not delete item.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Menu Dishes</Text>
        <Pressable style={styles.addTabBtn} onPress={() => setIsAdding(!isAdding)}>
          <Plus size={24} color={isAdding ? Colors.error : Colors.primary[500]} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Toggle Adding Form */}
        {isAdding && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>New Menu Item Details</Text>

            {/* Item Name */}
            <Text style={styles.label}>Dish Name</Text>
            <View style={styles.inputWrap}>
              <Utensils size={18} color={Colors.neutral[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Traditional Paneer Tikka"
                placeholderTextColor={Colors.neutral[400]}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { height: 60, paddingVertical: Spacing.sm }]}
                placeholder="Briefly describe the ingredients, spice level, or taste profile"
                placeholderTextColor={Colors.neutral[400]}
                multiline
                numberOfLines={2}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Row: Price & Category */}
            <View style={styles.formRow}>
              <View style={{ flex: 1.1, marginRight: Spacing.md }}>
                <Text style={styles.label}>Price (₹)</Text>
                <View style={styles.inputWrap}>
                  <Text style={{ marginRight: 8, color: Colors.neutral[400] }}>₹</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="250"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.neutral[400]}
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </View>

              <View style={{ flex: 1.3 }}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map(cat => (
                      <Pressable
                        key={cat}
                        style={[
                          styles.catChip,
                          category === cat && styles.catChipActive
                        ]}
                        onPress={() => setCategory(cat)}>
                        <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Popular switch */}
            <Pressable 
              style={styles.popularRow}
              onPress={() => setPopular(!popular)}>
              <View style={[styles.popularCheckbox, popular && styles.popularCheckboxActive]}>
                {popular && <Check size={14} color="#fff" strokeWidth={3} />}
              </View>
              <View style={styles.popularInfo}>
                <Text style={styles.popularHeader}>Mark as Recommended / Popular</Text>
                <Text style={styles.popularSubtitle}>This places a fire badge and highlights the dish for buyers</Text>
              </View>
            </Pressable>

            {/* Actions */}
            <View style={styles.buttonsWrap}>
              <Pressable style={styles.cancelFormBtn} onPress={() => setIsAdding(false)}>
                <Text style={styles.cancelFormBtnTxt}>Cancel</Text>
              </Pressable>
              
              <Pressable style={styles.saveItemBtn} onPress={handleAddItem}>
                <ChefHat size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.saveItemBtnTxt}>Save to Menu</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Existing items */}
        <Text style={styles.sectionTitle}>Active Menu Items ({menuItems.length})</Text>

        {menuItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ChefHat size={40} color={Colors.neutral[300]} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Your Kitchen is Empty</Text>
            <Text style={styles.emptySubtitle}>{"Click the \"+\" icon on the top right to register your first spectacular meal!"}</Text>
          </View>
        ) : (
          <View style={styles.dishesList}>
            {menuItems.map(item => (
              <View key={item.id} style={styles.itemCard}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                
                <View style={styles.itemContent}>
                  <View style={styles.itemRowHeader}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    {item.popular && (
                      <View style={styles.popBadge}>
                        <Sparkles size={10} color="#fff" fill="#fff" />
                        <Text style={styles.popBadgeText}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>
                  
                  <View style={styles.bottomRow}>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    <Text style={styles.itemCost}>₹{item.price}</Text>
                  </View>
                </View>

                {/* Delete button */}
                <Pressable 
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteItem(item.id, item.name)}>
                  <Trash2 size={20} color={Colors.error} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  addTabBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md + 1,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.md,
  },
  formContainer: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.primary[100],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  formTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.primary[600],
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.sm + 1,
    color: Colors.text,
    fontFamily: 'Inter-Regular',
  },
  formRow: {
    flexDirection: 'row',
  },
  categoryScroller: {
    height: 48,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  catChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  catChipTextActive: {
    color: '#fff',
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  popularCheckbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularCheckboxActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  popularInfo: {
    flex: 1,
  },
  popularHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
  },
  popularSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  buttonsWrap: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormBtnTxt: {
    color: Colors.neutral[600],
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.sm,
  },
  saveItemBtn: {
    flex: 1.5,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveItemBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.sm,
  },
  dishesList: {
    gap: Spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    gap: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  itemImage: {
    width: 76,
    height: 76,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemName: {
    fontSize: FontSizes.sm + 1,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    maxWidth: '65%',
  },
  popBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    gap: 2,
  },
  popBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '900',
  },
  itemDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary[500],
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  itemCost: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  deleteBtn: {
    padding: Spacing.md,
    alignSelf: 'center',
  },
  emptyWrap: {
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
});
