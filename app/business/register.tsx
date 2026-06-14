import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, Alert } from 'react-native';
import { ArrowLeft, Store, MapPin, Clock, Check, Layers } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { saveOwnedRestaurant, CURATED_FOOD_IMAGES, getOwnedRestaurant } from '../../lib/business';
import * as ImagePicker from 'expo-image-picker';
export default function BusinessRegisterScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceRange, setPriceRange] = useState<'Budget' | 'Mid Range' | 'Premium'>('Mid Range');
  const [deliveryTime, setDeliveryTime] = useState('25-35');
  const [deliveryFee, setDeliveryFee] = useState('40');
  const [city, setCity] = useState<'Hyderabad' | 'Bengaluru' | 'Chennai' | 'Mumbai'>('Hyderabad');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(CURATED_FOOD_IMAGES[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRestaurantId, setExistingRestaurantId] = useState<string | null>(null);
  const [existingRestaurantRating, setExistingRestaurantRating] = useState<number>(5);
  const [existingRestaurantReviewCount, setExistingRestaurantReviewCount] = useState<number>(1);
  const [headerTitle, setHeaderTitle] = useState('Register Restaurant');

  useEffect(() => {
    const loadExistingRestaurant = async () => {
      if (!user) return;
      const existing = await getOwnedRestaurant(user.id);
      if (!existing) return;
      setExistingRestaurantId(existing.id);
      setHeaderTitle('Edit Store Details');
      setName(existing.name);
      setCuisine(existing.cuisine);
      setPriceRange(['Budget', 'Mid Range', 'Premium'].includes(existing.priceRange) ? existing.priceRange as 'Budget' | 'Mid Range' | 'Premium' : 'Mid Range');
      setDeliveryTime(existing.deliveryTime);
      setDeliveryFee(existing.deliveryFee.toString());
      setCity(existing.city);
      setTagsInput(existing.tags.join(', '));
      setSelectedImage(existing.image || CURATED_FOOD_IMAGES[0].url);
      setExistingRestaurantRating(existing.rating ?? 5);
      setExistingRestaurantReviewCount(existing.reviewCount ?? 1);
    };

    loadExistingRestaurant();
  }, [user]);

const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to pick image');
  }
};
  const handleRegister = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to register a business.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter your restaurant name.');
      return;
    }

    if (!cuisine.trim()) {
      Alert.alert('Missing Field', 'Please specify your dominant cuisine (e.g. Hyderabadi Biryani).');
      return;
    }

    if (!deliveryTime.trim()) {
      Alert.alert('Missing Field', 'Please enter your average delivery time range for the restaurant.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Split tags comma separated
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (tags.length === 0) {
        tags.push('Restaurant', cuisine.trim());
      }

      const restaurantId = existingRestaurantId ?? `rest-${user.id.substring(0, 5)}-${Date.now().toString().slice(-4)}`;
      await saveOwnedRestaurant(user.id, {
        id: restaurantId,
        name: name.trim(),
        cuisine: cuisine.trim(),
        deliveryTime: deliveryTime.trim(),
        deliveryFee: Number(deliveryFee) || 0,
        priceRange,
        image: selectedImage,
        tags,
        city,
        featured: true,
        rating: existingRestaurantRating,
        reviewCount: existingRestaurantReviewCount,
      });

      Alert.alert(
        existingRestaurantId ? 'Updated!' : 'Success!',
        existingRestaurantId
          ? 'Your business profile has been updated successfully.'
          : 'Your business has been registered successfully. Welcome to LocalEats Merchant network!',
        [
          { 
            text: 'Launch Dashboard', 
            onPress: () => router.replace('/business/dashboard') 
          }
        ]
      );
    } catch (e: any) {
      Alert.alert(existingRestaurantId ? 'Update Failed' : 'Registration Failed', e.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topCard}>
          <View style={styles.iconCircle}>
            <Store size={32} color={Colors.primary[500]} strokeWidth={2} />
          </View>
          <Text style={styles.welcomeTitle}>Grow on LocalEats</Text>
          <Text style={styles.welcomeSubtitle}>
            Register your store details to unlock your customized merchant dashboard and start receiving local orders today.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Details</Text>
          
          {/* Restaurant Name */}
          <Text style={styles.label}>Restaurant Name</Text>
          <View style={styles.inputContainer}>
            <Store size={20} color={Colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Hyderabad Spice"
              placeholderTextColor={Colors.neutral[400]}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Cuisine */}
          <Text style={styles.label}>Dominant Cuisine</Text>
          <View style={styles.inputContainer}>
            <Layers size={20} color={Colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Mughlai, South Indian"
              placeholderTextColor={Colors.neutral[400]}
              value={cuisine}
              onChangeText={setCuisine}
            />
          </View>

          {/* City Selector */}
          <Text style={styles.label}>Operating City</Text>
          <View style={styles.cityGrid}>
            {(['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai'] as const).map(c => (
              <Pressable
                key={c}
                style={[styles.cityChip, city === c && styles.cityChipActive]}
                onPress={() => setCity(c)}>
                <MapPin size={16} color={city === c ? '#fff' : Colors.text} />
                <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          {/* Row Inputs: Price Range and Fees */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price Tier</Text>
              <View style={styles.tierContainer}>
                {(['Budget', 'Mid Range', 'Premium'] as const).map(tier => (
                  <Pressable
                    key={tier}
                    style={[styles.tierSegment, priceRange === tier && styles.tierSegmentActive]}
                    onPress={() => setPriceRange(tier)}>
                    <Text style={[styles.tierText, priceRange === tier && styles.tierTextActive]}>
                      {tier === 'Budget' ? '₹' : tier === 'Mid Range' ? '₹₹' : '₹₹₹'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Text style={styles.label}>Delivery Fee (₹)</Text>
              <View style={styles.inputContainer}>
                <Text style={{ marginRight: 8, color: Colors.neutral[400] }}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="40"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.neutral[400]}
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Delivery Time (min)</Text>
              <View style={styles.inputContainer}>
                <Clock size={18} color={Colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="20-30"
                  placeholderTextColor={Colors.neutral[400]}
                  value={deliveryTime}
                  onChangeText={setDeliveryTime}
                />
              </View>
            </View>
          </View>

          {/* Tags */}
          <Text style={styles.label}>Search Keywords / Tags (comma separated)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Spicy, Biryani, Rice, Desserts"
              placeholderTextColor={Colors.neutral[400]}
              value={tagsInput}
              onChangeText={setTagsInput}
            />
          </View>
        </View>

        {/* Image Picker */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Banner Image</Text>
          <Text style={styles.imageHelp}>Choose a mouth-watering banner image for your store front:</Text>

          <View style={styles.curatedGrid}>
            {CURATED_FOOD_IMAGES.map((img, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.imageFrame,
                  selectedImage === img.url && styles.imageFrameSelected
                ]}
                onPress={() => setSelectedImage(img.url)}>
                <Image source={{ uri: img.url }} style={styles.curatedImg} />
                {selectedImage === img.url && (
                  <View style={styles.checkedOverlay}>
                    <Check size={16} color="#fff" strokeWidth={3} />
                  </View>
                )}
                 <Text style={styles.imageName} numberOfLines={1}>{img.name}</Text>
              </Pressable>
            ))}
          <Pressable
  style={{
    backgroundColor: Colors.primary[500],
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  }}
  onPress={pickImage}
>
  <Text style={{ color: '#fff', fontWeight: '600' }}>
    Choose Image From Gallery
  </Text>
</Pressable>
</View>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          disabled={isSubmitting}
          onPress={handleRegister}>
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Registering Your Business...' : 'Create & Launch Storefront'}
          </Text>
        </Pressable>

        <View style={{ height: Spacing.xxl }} />
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
  scrollContent: {
    padding: Spacing.lg,
  },
  topCard: {
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  welcomeTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary[600],
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  section: {
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: 50,
    marginBottom: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontFamily: 'Inter-Regular',
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  cityChipText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontFamily: 'Inter-Medium',
  },
  cityChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  tierContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    height: 50,
  },
  tierSegment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  tierSegmentActive: {
    backgroundColor: Colors.primary[500],
  },
  tierText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  tierTextActive: {
    color: '#fff',
  },
  imageHelp: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.md,
  },
  curatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  imageFrame: {
    width: '47%',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    padding: Spacing.xs,
    position: 'relative',
    paddingBottom: Spacing.xs,
  },
  imageFrameSelected: {
    borderColor: Colors.primary[500],
  },
  curatedImg: {
    width: '100%',
    height: 90,
    backgroundColor: Colors.neutral[200],
  },
  checkedOverlay: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.primary[500],
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  imageName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Spacing.xs,
    color: Colors.text,
    paddingHorizontal: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});
