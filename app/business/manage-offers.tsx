import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, Alert, ActivityIndicator, Switch } from 'react-native';
import { ArrowLeft, Tag, Plus, Check, Trash2, Calendar, Image as ImageIcon, Percent, Edit3, ShieldAlert } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getOwnedRestaurant, getOffers, createOffer, updateOffer, deleteOffer } from '../../lib/business';
import { Restaurant, Offer } from '../../types';

const PRESET_BANNER_IMAGES = [
  'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600', // Spicy Biryani
  'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600', // North Indian Feast
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600', // South Indian Thali
  'https://images.pexels.com/photos/2915282/pexels-photo-2915282.jpeg?auto=compress&cs=tinysrgb&w=600', // Sweet desserts/treats
];

export default function ManageOffersScreen() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [startDate, setStartDate] = useState('2026-06-11');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [bannerImage, setBannerImage] = useState(PRESET_BANNER_IMAGES[0]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadRestaurantAndOffers();
  }, [user]);

  const loadRestaurantAndOffers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const rest = await getOwnedRestaurant(user.id);
      if (!rest) {
        Alert.alert('Error', 'Please register your restaurant first.');
        router.replace('/business/register');
        return;
      }
      setRestaurant(rest);
      const loadedOffers = await getOffers(rest.id);
      setOffers(loadedOffers);
    } catch (e) {
      console.error("Error loading offers:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateForm = () => {
    setTitle('');
    setDescription('');
    setDiscountPercentage('');
    setStartDate('2026-06-11');
    setEndDate('2026-12-31');
    setBannerImage(PRESET_BANNER_IMAGES[Math.floor(Math.random() * PRESET_BANNER_IMAGES.length)]);
    setIsActive(true);
    setEditingOfferId(null);
    setIsFormVisible(true);
  };

  const handleOpenEditForm = (offer: Offer) => {
    setTitle(offer.title);
    setDescription(offer.description);
    setDiscountPercentage(offer.discountPercentage.toString());
    setStartDate(offer.startDate);
    setEndDate(offer.endDate);
    setBannerImage(offer.bannerImage);
    setIsActive(offer.isActive);
    setEditingOfferId(offer.id);
    setIsFormVisible(true);
  };

  const handleSaveOffer = async () => {
    if (!restaurant) return;

    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter an offer title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please enter a description explaining what the offer provides.');
      return;
    }

    const discountNum = Number(discountPercentage);
    if (!discountPercentage.trim() || isNaN(discountNum) || discountNum < 1 || discountNum > 99) {
      Alert.alert('Required Field', 'Please enter a valid discount percentage (1% to 99%).');
      return;
    }

    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('Required Field', 'Valid start and end dates are required (format YYYY-MM-DD).');
      return;
    }

    try {
      setLoading(true);
      if (editingOfferId) {
        // Edit flow
        const updatedObj: Offer = {
          id: editingOfferId,
          restaurantId: restaurant.id,
          title: title.trim(),
          description: description.trim(),
          discountPercentage: discountNum,
          startDate: startDate.trim(),
          endDate: endDate.trim(),
          bannerImage: bannerImage.trim(),
          isActive: isActive
        };
        await updateOffer(restaurant.id, updatedObj);
        Alert.alert('Success', 'Promotion offer updated successfully!');
      } else {
        // Create flow
        await createOffer(restaurant.id, {
          title: title.trim(),
          description: description.trim(),
          discountPercentage: discountNum,
          startDate: startDate.trim(),
          endDate: endDate.trim(),
          bannerImage: bannerImage.trim()
        });
        Alert.alert('Success', 'New promotional offer has been created successfully!');
      }

      // Reload
      const loadedOffers = await getOffers(restaurant.id);
      setOffers(loadedOffers);
      setIsFormVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error occurred', 'Could not save the offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = (offerId: string) => {
    if (!restaurant) return;
    Alert.alert(
      'Delete Promotion?',
      'Are you sure you want to permanently delete this offer? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteOffer(restaurant.id, offerId);
              const loadedOffers = await getOffers(restaurant.id);
              setOffers(loadedOffers);
              Alert.alert('Deleted', 'Promotion offer was removed.');
            } catch (err) {
              Alert.alert('Error', 'Deletion failed.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleOfferActive = async (offer: Offer, value: boolean) => {
    if (!restaurant) return;
    try {
      const updatedObj = { ...offer, isActive: value };
      await updateOffer(restaurant.id, updatedObj);
      const loadedOffers = await getOffers(restaurant.id);
      setOffers(loadedOffers);
    } catch (err) {
      console.error("Toggle active failed:", err);
      Alert.alert('Error', 'Failed to toggle activation status.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => {
          if (isFormVisible) {
            setIsFormVisible(false);
          } else {
            router.back();
          }
        }}>
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isFormVisible ? (editingOfferId ? 'Edit Offer' : 'Create Offer') : 'Store Promotions'}
        </Text>
        {!isFormVisible ? (
          <Pressable style={styles.createBtn} onPress={handleOpenCreateForm}>
            <Plus size={20} color="#fff" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading && !isFormVisible && (
        <View style={styles.centeredRow}>
          <ActivityIndicator size="small" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading promotions...</Text>
        </View>
      )}

      {isFormVisible ? (
        <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.formLabel}>Offer Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Summer Dhamaka Flat 20%"
              placeholderTextColor={Colors.neutral[400]}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.formLabel}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Get a flat 20% discount on all orders above ₹400. Applicable twice daily."
              placeholderTextColor={Colors.neutral[400]}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.row}>
              <View style={[styles.col, { marginRight: Spacing.md }]}>
                <Text style={styles.formLabel}>Discount Percentage <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Percent size={16} color={Colors.neutral[400]} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 34 }]}
                    placeholder="e.g. 20"
                    placeholderTextColor={Colors.neutral[400]}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={discountPercentage}
                    onChangeText={setDiscountPercentage}
                  />
                </View>
              </View>

              <View style={styles.col}>
                <Text style={styles.formLabel}>Valid Till Year <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Calendar size={16} color={Colors.neutral[400]} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 34 }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.neutral[400]}
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.col, { marginRight: Spacing.md }]}>
                <Text style={styles.formLabel}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.neutral[400]}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={styles.col}>
                {editingOfferId && (
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={[styles.formLabel, { marginBottom: 10 }]}>Offer Active</Text>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleText}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                      <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        trackColor={{ false: Colors.neutral[200], true: Colors.primary[200] }}
                        thumbColor={isActive ? Colors.primary[500] : Colors.neutral[400]}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.formLabel}>Offer Banner Image</Text>
            <TextInput
              style={[styles.input, { marginBottom: Spacing.md }]}
              placeholder="Enter custom banner image URL"
              placeholderTextColor={Colors.neutral[400]}
              value={bannerImage}
              onChangeText={setBannerImage}
            />

            <Text style={styles.subtext}>Select a default theme template:</Text>
            <View style={styles.presetRow}>
              {PRESET_BANNER_IMAGES.map((img, i) => (
                <Pressable
                  key={i}
                  style={[styles.presetCard, bannerImage === img && styles.presetCardSelected]}
                  onPress={() => setBannerImage(img)}>
                  <Image source={{ uri: img }} style={styles.presetImage} />
                  {bannerImage === img && (
                    <View style={styles.presetCheck}>
                      <Check size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewHeading}>LIVE PREVIEW FOR CUSTOMERS</Text>
            <View style={styles.previewBanner}>
              <Image source={{ uri: bannerImage || PRESET_BANNER_IMAGES[0] }} style={styles.previewBannerImg} />
              <View style={styles.previewOverlay} />
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>FLAT {discountPercentage || 'XX'}% OFF</Text>
              </View>
              <View style={styles.previewTextWrapper}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {title || 'Example Epic Discount offer'}
                </Text>
                <Text style={styles.previewDesc} numberOfLines={2}>
                  {description || 'Offer description explaining rules and criteria goes directly here.'}
                </Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.saveBtn} onPress={handleSaveOffer}>
            <Check size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>{editingOfferId ? 'Update Promotion' : 'Activate Promotion'}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.merchantGuidance}>
            <Tag size={16} color={Colors.primary[600]} style={{ marginRight: 6 }} />
            <Text style={styles.guidanceText}>
              Active offers will auto-populate as interactive banners on the customer home screen and your restaurant details page.
            </Text>
          </View>

          {offers.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Tag size={56} color={Colors.neutral[300]} strokeWidth={1} />
              <Text style={styles.emptyStateTitle}>No Active Offers</Text>
              <Text style={styles.emptyStateSubtitle}>
                You have not registered any promotions yet. Click the &quot;+&quot; button in the top right to launch your first sales-boosting campaign!
              </Text>
              <Pressable style={styles.emptyActionBtn} onPress={handleOpenCreateForm}>
                <Plus size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Create Offer Campaign</Text>
              </Pressable>
            </View>
          ) : (
            offers.map((offer) => (
              <View key={offer.id} style={styles.offerCardItem}>
                <View style={styles.offerCardBannerWrapper}>
                  <Image source={{ uri: offer.bannerImage }} style={styles.offerCardBanner} />
                  <View style={styles.bannerOverlay} />
                  <View style={[styles.offerBadge, { backgroundColor: offer.isActive ? Colors.primary[500] : Colors.neutral[500] }]}>
                    <Text style={styles.offerBadgeText}>{offer.discountPercentage}% OFF</Text>
                  </View>
                  <View style={styles.offerTextOverlay}>
                    <Text style={styles.offerCardTitle} numberOfLines={1}>{offer.title}</Text>
                    <Text style={styles.offerCardDesc} numberOfLines={1}>{offer.description}</Text>
                  </View>
                </View>

                {/* Offer Status & Management actions */}
                <View style={styles.cardActionsRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.dateLabel}>VALIDITY TIMELINE</Text>
                    <Text style={styles.dateValue}>{offer.startDate} to {offer.endDate}</Text>
                  </View>

                  <View style={styles.actionCtrlRow}>
                    {/* Toggle Switch */}
                    <View style={styles.toggleCtrl}>
                      <Switch
                        value={offer.isActive}
                        onValueChange={(val) => handleToggleOfferActive(offer, val)}
                        trackColor={{ false: Colors.neutral[200], true: Colors.primary[100] }}
                        thumbColor={offer.isActive ? Colors.primary[500] : Colors.neutral[400]}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                      <Text style={[styles.toggleLabel, { color: offer.isActive ? Colors.primary[600] : Colors.neutral[500] }]}>
                        {offer.isActive ? 'ACTIVE' : 'OFFLINE'}
                      </Text>
                    </View>

                    {/* Edit button */}
                    <Pressable style={styles.iconActionBtn} onPress={() => handleOpenEditForm(offer)}>
                      <Edit3 size={15} color={Colors.neutral[600]} />
                    </Pressable>

                    {/* Delete button */}
                    <Pressable style={[styles.iconActionBtn, styles.deleteBtn]} onPress={() => handleDeleteOffer(offer.id)}>
                      <Trash2 size={15} color={Colors.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.primary[600],
    fontFamily: 'Inter-Medium',
  },
  merchantGuidance: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  guidanceText: {
    flex: 1,
    fontSize: FontSizes.xs + 1,
    color: Colors.primary[700],
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  listScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: FontSizes.md + 1,
    fontWeight: '700',
    color: Colors.neutral[600],
    fontFamily: 'Inter-Bold',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[400],
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
    marginBottom: Spacing.xl,
    fontFamily: 'Inter-Regular',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  emptyActionBtnText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.sm,
  },
  offerCardItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  offerCardBannerWrapper: {
    height: 120,
    position: 'relative',
  },
  offerCardBanner: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  offerBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  offerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
  },
  offerTextOverlay: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.md,
    right: Spacing.md,
  },
  offerCardTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  offerCardDesc: {
    fontSize: FontSizes.xs + 1,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  cardActionsRow: {
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1.2,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.neutral[400],
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: FontSizes.xs + 1,
    color: Colors.text,
    fontFamily: 'Inter-Medium',
    marginTop: 1,
  },
  actionCtrlRow: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  toggleCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  toggleLabel: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginLeft: 2,
  },
  iconActionBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  formScroll: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  formContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontFamily: 'Inter-Regular',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 13,
    zIndex: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.border,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    height: 42,
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
  },
  toggleText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary[600],
    fontFamily: 'Inter-Bold',
  },
  subtext: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  presetCard: {
    width: '23%',
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  presetCardSelected: {
    borderColor: Colors.primary[500],
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  presetCheck: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCard: {
    backgroundColor: Colors.neutral[900],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary[400],
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  previewBanner: {
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewBannerImg: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  previewBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  previewBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
  },
  previewTextWrapper: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
  },
  previewTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  previewDesc: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: FontSizes.sm + 1,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});
