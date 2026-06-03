import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ArrowLeft, CheckCircle2, Truck } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../constants/theme';
import { useCart } from '../context/CartContext';

interface DeliveryOption {
  id: string;
  name: string;
  minTime: number;
  maxTime: number;
  minCost: number;
  maxCost: number;
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'rapido',
    name: 'Rapido',
    minTime: 20,
    maxTime: 25,
    minCost: 45,
    maxCost: 65,
  },
  {
    id: 'uber',
    name: 'Uber',
    minTime: 18,
    maxTime: 22,
    minCost: 55,
    maxCost: 75,
  },
  {
    id: 'porter',
    name: 'Porter',
    minTime: 22,
    maxTime: 30,
    minCost: 50,
    maxCost: 70,
  },
];

export default function DeliveryPartnerScreen() {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { clearCart } = useCart();

  const handleConfirm = () => {
    if (selectedPartner) {
      setConfirmed(true);
      setTimeout(() => {
        clearCart();
        router.replace('/(tabs)');
      }, 2000);
    }
  };

  if (confirmed) {
    const partner = DELIVERY_OPTIONS.find(p => p.id === selectedPartner);
    return (
      <View style={styles.confirmContainer}>
        <View style={styles.confirmContent}>
          <View style={styles.confirmIconCircle}>
            <CheckCircle2 size={64} color={Colors.success} strokeWidth={2} />
          </View>
          <Text style={styles.confirmTitle}>Order Confirmed!</Text>
          <Text style={styles.confirmMessage}>
            You selected <Text style={styles.partnerName}>{partner?.name}</Text>
          </Text>
          <Text style={styles.confirmSubtitle}>
            Estimated delivery in {partner?.minTime}-{partner?.maxTime} minutes
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Choose Delivery Partner</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <Text style={styles.subtitle}>Select your preferred delivery service</Text>

        <View style={styles.optionsContainer}>
          {DELIVERY_OPTIONS.map(option => (
            <Pressable
              key={option.id}
              style={[
                styles.optionCard,
                selectedPartner === option.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedPartner(option.id)}>
              <View style={styles.optionHeader}>
                <View style={styles.optionIconContainer}>
                  <Truck size={24} color={Colors.primary[500]} strokeWidth={2} />
                </View>
                <View style={styles.optionNameContainer}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  {selectedPartner === option.id && (
                    <View style={styles.selectedBadge}>
                      <CheckCircle2 size={16} color={Colors.primary[500]} strokeWidth={2.5} />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.optionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cost:</Text>
                  <Text style={styles.detailValue}>
                    ₹{option.minCost}–₹{option.maxCost}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {option.minTime}–{option.maxTime} mins
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.confirmButton, !selectedPartner && styles.confirmButtonDisabled]}
          disabled={!selectedPartner}
          onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>
            {selectedPartner ? `Confirm with ${DELIVERY_OPTIONS.find(p => p.id === selectedPartner)?.name}` : 'Select a partner'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
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
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.lg,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  optionCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  selectedBadge: {
    marginLeft: Spacing.sm,
  },
  optionDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  detailValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  confirmButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  confirmContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  confirmContent: {
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  confirmTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  partnerName: {
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
  },
  confirmSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
