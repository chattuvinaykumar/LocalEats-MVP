import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { ArrowLeft, Plus, Trash2, Pin, Check, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../lib/business';

const ADDRESSES_STORAGE_KEY = 'localeats_saved_addresses';

type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  area: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
};

function safeLocalStorageSet(key: string, value: string) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
}

function safeLocalStorageGet(key: string) {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
}

function requestConfirmation(title: string, message: string, onConfirm: () => void) {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function DeliveryAddressesScreen() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const data = await getAddresses(user.id);
        setAddresses(data || []);
      } catch (e) {
        console.warn('Failed to load addresses, fallback to empty', e);
      }
    };
    load();
  }, [user]);

  const saveAddresses = (next: Address[]) => {
    setAddresses(next);
  };

  const clearForm = () => {
    setLabel('Home');
    setLine1('');
    setLine2('');
    setArea('');
    setCity('');
    setStateValue('');
    setZip('');
    setPhone('');
    setEditingAddressId(null);
    setLocationError('');
  };

  const openNewAddressForm = () => {
    clearForm();
    setIsFormOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setLabel(address.label);
    setLine1(address.line1);
    setLine2(address.line2);
    setArea(address.area);
    setCity(address.city);
    setStateValue(address.state);
    setZip(address.zip);
    setPhone(address.phone);
    setLocationError('');
    setIsFormOpen(true);
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Reverse geocode failed');
    }
    return response.json();
  };

  const handleUseCurrentLocation = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Location is not available in this browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await reverseGeocode(latitude, longitude);
          const address = data.address || {};

          const newLine1 = [address.house_number, address.road, address.pedestrian, address.neighbourhood]
            .filter(Boolean)
            .join(' ')
            .trim();
          const newArea = address.suburb || address.neighbourhood || address.village || address.hamlet || '';
          const newCity = address.city || address.town || address.village || address.county || '';
          const newState = address.state || address.region || '';
          const newZip = address.postcode || '';
          const fullAddress = data.display_name || '';

          setLine1(newLine1 || fullAddress || 'Current location');
          setArea(newArea);
          setCity(newCity);
          setStateValue(newState);
          setZip(newZip);
          if (!label.trim()) {
            setLabel('Current Location');
          }
          setFeedback('Location detected. You can edit details before saving.');
          setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
          setLocationError('Unable to convert location to an address. Please enter manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      error => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access.');
        } else {
          setLocationError('Unable to detect location. Please try again or enter manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleDeleteAddress = (id: string, labelText?: string) => {
    // Defer actual deletion until user confirms in the UI modal to avoid accidental deletes
    setPendingDeleteId(id);
    setPendingDeleteLabel(labelText || null);
  };

  const confirmDeleteAddress = async () => {
    if (!pendingDeleteId) return;
    try {
      if (user) await deleteAddress(user.id, pendingDeleteId);
      const next = addresses.filter(item => item.id !== pendingDeleteId);
      saveAddresses(next);
      setFeedback('Address deleted successfully.');
      setTimeout(() => setFeedback(''), 2500);
    } catch (e) {
      Alert.alert('Error', 'Failed to delete address.');
    } finally {
      setPendingDeleteId(null);
      setPendingDeleteLabel(null);
      setConfirmText('');
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    setPendingDeleteLabel(null);
    setConfirmText('');
  };

  const handleSetDefault = async (id: string) => {
    try {
      if (!user) return;
      // mark server-side
      await updateAddress(user.id, id, { is_default: true, updated_at: new Date().toISOString() });
      const data = await getAddresses(user.id);
      saveAddresses(data || []);
      setFeedback('Default address updated.');
      setTimeout(() => setFeedback(''), 2500);
    } catch (e) {
      setFeedback('Failed to set default address.');
      setTimeout(() => setFeedback(''), 2500);
    }
  };

  const handleSaveAddress = async () => {
    if (!line1.trim() || !area.trim() || !city.trim() || !stateValue.trim() || !zip.trim() || !phone.trim()) {
      Alert.alert('Missing information', 'Please complete all required fields to save your address.');
      return;
    }
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to save addresses.');
      return;
    }

    try {
      const payload = {
        label: label.trim() || 'Home',
        recipient_name: label.trim(),
        phone: phone.trim(),
        address_line: line1.trim() + (line2 ? `, ${line2.trim()}` : ''),
        city: city.trim(),
        state: stateValue.trim(),
        postal_code: zip.trim(),
        is_default: editingAddressId ? undefined : addresses.length === 0
      } as any;

      if (editingAddressId) {
        await updateAddress(user.id, editingAddressId, payload);
      } else {
        await createAddress(user.id, payload);
      }

      const data = await getAddresses(user.id);
      saveAddresses(data || []);
      setFeedback(editingAddressId ? 'Address updated successfully.' : 'Address added successfully.');
      setTimeout(() => setFeedback(''), 2500);
      clearForm();
      setIsFormOpen(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save address.');
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Delivery Addresses</Text>
          <Text style={styles.subtitle}>Add, edit, and manage all your saved delivery addresses.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Pin size={20} color={Colors.primary[500]} />
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
        </View>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No saved addresses yet.</Text>
            <Text style={styles.emptySubtitle}>Add your first address to speed up checkout.</Text>
          </View>
        ) : (
          addresses.map(address => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressRow}>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  <Text style={styles.addressText}>{address.line1}</Text>
                  {address.line2 ? <Text style={styles.addressText}>{address.line2}</Text> : null}
                  {address.area ? <Text style={styles.addressText}>{address.area}</Text> : null}
                  <Text style={styles.addressText}>{`${address.city}, ${address.state} ${address.zip}`}</Text>
                  <Text style={styles.addressText}>{address.phone}</Text>
                </View>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Check size={14} color="#fff" />
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => handleSetDefault(address.id)}
                  style={({ pressed }) => [styles.actionPill, pressed && styles.buttonPressed]}
                  android_ripple={{ color: Colors.neutral[200] }}>
                  <Text style={styles.actionText}>{address.isDefault ? 'Default' : 'Set Default'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleEditAddress(address)}
                  style={({ pressed }) => [styles.actionPill, pressed && styles.buttonPressed]}
                  android_ripple={{ color: Colors.neutral[200] }}>
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteAddress(address.id)}
                  style={({ pressed }) => [styles.deletePill, pressed && styles.buttonPressed]}
                  android_ripple={{ color: Colors.neutral[200] }}>
                  <Trash2 size={14} color={Colors.error} />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.addHeader}>
          <Text style={styles.sectionTitle}>{isFormOpen ? editingAddressId ? 'Edit Address' : 'Add Address' : 'Manage Address'}</Text>
          <Pressable
            onPress={openNewAddressForm}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            android_ripple={{ color: Colors.neutral[200] }}>
            <Plus size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>Add Address</Text>
          </Pressable>
        </View>

        {isFormOpen ? (
          <View style={styles.formCard}>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Label (e.g. Home, Work)"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            <TextInput
              value={line1}
              onChangeText={setLine1}
              placeholder="Address line 1"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            <Pressable
              onPress={handleUseCurrentLocation}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              android_ripple={{ color: Colors.neutral[200] }}>
              <MapPin size={16} color="#fff" />
              <Text style={styles.secondaryButtonText}>{locationLoading ? 'Detecting location...' : 'Use Current Location'}</Text>
            </Pressable>
            {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
            <TextInput
              value={line2}
              onChangeText={setLine2}
              placeholder="Address line 2 (optional)"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            <TextInput
              value={area}
              onChangeText={setArea}
              placeholder="Area / Locality"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            <TextInput
              value={stateValue}
              onChangeText={setStateValue}
              placeholder="State"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            <TextInput
              value={zip}
              onChangeText={setZip}
              placeholder="ZIP / Postal Code"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            <Pressable
              onPress={handleSaveAddress}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              android_ripple={{ color: Colors.neutral[200] }}>
              <Text style={styles.primaryButtonText}>{editingAddressId ? 'Update Address' : 'Save Address'}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.sectionText}>Use this form to keep your delivery address list current.</Text>
        )}
      </View>

      {pendingDeleteId ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>{`Delete address${pendingDeleteLabel ? ` "${pendingDeleteLabel}"` : ''}? This action cannot be undone.`}</Text>
            <TextInput
              placeholder="Type DELETE to confirm"
              value={confirmText}
              onChangeText={setConfirmText}
              placeholderTextColor={Colors.neutral[400]}
              style={[styles.textInput, { marginTop: Spacing.sm }]}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <Pressable onPress={cancelDelete} style={({ pressed }) => [styles.actionPill, pressed && styles.buttonPressed]}>
                <Text style={styles.actionText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmDeleteAddress} disabled={confirmText !== 'DELETE'} style={({ pressed }) => [styles.deletePill, pressed && styles.buttonPressed, confirmText !== 'DELETE' && { opacity: 0.5 }]}>
                <Text style={[styles.actionText, styles.deleteText]}>Confirm Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {feedback ? <Text style={styles.successText}>{feedback}</Text> : null}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  titleBlock: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    ...Shadows.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  emptyState: {
    paddingVertical: Spacing.lg,
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
  addressCard: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  addressText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  deletePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  actionText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Medium',
  },
  deleteText: {
    color: Colors.error,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[500],
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  formCard: {
    marginTop: Spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[700],
    marginBottom: Spacing.sm,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[50],
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontFamily: 'Inter-Regular',
  },
  sectionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: Spacing.sm,
  },
  successText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
  modalOverlay: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  modalMessage: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
});