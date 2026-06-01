import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useLocation } from '../context/LocationContext';

type City = 'Hyderabad' | 'Bengaluru' | 'Chennai' | 'Mumbai';

const CITIES: City[] = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai'];

interface LocationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LocationSelectorModal({ visible, onClose }: LocationSelectorModalProps) {
  const { city, setCity } = useLocation();

  const handleSelectCity = (selectedCity: City) => {
    setCity(selectedCity);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Select City</Text>
            <Pressable onPress={onClose}>
              <X size={24} color={Colors.text} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.cityList}>
            {CITIES.map(c => (
              <Pressable
                key={c}
                style={[styles.cityItem, city === c && styles.cityItemSelected]}
                onPress={() => handleSelectCity(c)}>
                <Text style={[styles.cityText, city === c && styles.cityTextSelected]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    width: '80%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  cityList: {
    paddingVertical: Spacing.sm,
  },
  cityItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  cityItemSelected: {
    backgroundColor: Colors.primary[50],
    borderBottomColor: Colors.border,
  },
  cityText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: 'Inter-Regular',
  },
  cityTextSelected: {
    fontWeight: '700',
    color: Colors.primary[600],
    fontFamily: 'Inter-Bold',
  },
});
