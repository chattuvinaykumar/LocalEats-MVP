import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { ArrowLeft, Plus, Trash2, CreditCard, Smartphone, DollarSign, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';

const PAYMENT_STORAGE_KEY = 'localeats_saved_payment_methods';

type PaymentMethodType = 'upi' | 'card' | 'cod';

type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  label: string;
  details: string;
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

export default function PaymentMethodsScreen() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [methodType, setMethodType] = useState<PaymentMethodType>('upi');
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const raw = safeLocalStorageGet(PAYMENT_STORAGE_KEY);
    if (raw) {
      try {
        setMethods(JSON.parse(raw));
      } catch {
        setMethods([]);
      }
    }
  }, []);

  const saveMethods = (next: PaymentMethod[]) => {
    setMethods(next);
    safeLocalStorageSet(PAYMENT_STORAGE_KEY, JSON.stringify(next));
  };

  const clearForm = () => {
    setEditingMethodId(null);
    setMethodType('upi');
    setLabel('');
    setDetails('');
  };

  const openNewMethodForm = () => {
    clearForm();
    setIsFormOpen(true);
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethodId(method.id);
    setMethodType(method.type);
    setLabel(method.label);
    setDetails(method.details);
    setIsFormOpen(true);
  };

  const handleDeleteMethod = (id: string) => {
    requestConfirmation('Delete payment method', 'Are you sure you want to delete this payment method?', () => {
      const next = methods.filter(item => item.id !== id);
      saveMethods(next);
      setFeedback('Payment method deleted successfully.');
      setTimeout(() => setFeedback(''), 2500);
    });
  };

  const handleSetDefault = (id: string) => {
    const next = methods.map(item => ({ ...item, isDefault: item.id === id }));
    saveMethods(next);
    setFeedback('Default payment method updated.');
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleSaveMethod = () => {
    if (!label.trim()) {
      Alert.alert('Missing information', 'Please provide a label for the payment method.');
      return;
    }

    if (methodType !== 'cod' && !details.trim()) {
      Alert.alert('Missing information', 'Please provide payment details for this method.');
      return;
    }

    const nextMethod: PaymentMethod = {
      id: editingMethodId || `payment_${Date.now()}`,
      type: methodType,
      label: label.trim(),
      details: methodType === 'cod' ? 'Cash on Delivery' : details.trim(),
      isDefault: editingMethodId ? methods.find(m => m.id === editingMethodId)?.isDefault ?? false : methods.length === 0,
    };

    const next = editingMethodId
      ? methods.map(item => (item.id === editingMethodId ? nextMethod : item))
      : [...methods, nextMethod];

    const normalized = next.map(item => ({ ...item, isDefault: item.isDefault || (!next.some(m => m.isDefault) && item.id === nextMethod.id) }));
    saveMethods(normalized);
    setFeedback(editingMethodId ? 'Payment method updated successfully.' : 'Payment method added successfully.');
    setTimeout(() => setFeedback(''), 2500);
    clearForm();
    setIsFormOpen(false);
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
          <Text style={styles.title}>Payment Methods</Text>
          <Text style={styles.subtitle}>Add your preferred payment methods and choose a default option.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <CreditCard size={20} color={Colors.primary[500]} />
          <Text style={styles.sectionTitle}>Saved Methods</Text>
        </View>
        {methods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No payment methods saved.</Text>
            <Text style={styles.emptySubtitle}>Add UPI, card, or cash on delivery for faster checkout.</Text>
          </View>
        ) : (
          methods.map(method => (
            <View key={method.id} style={styles.methodCard}>
              <View style={styles.methodRow}>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodText}>{method.type === 'card' ? `Card • ${method.details}` : method.details}</Text>
                </View>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Check size={14} color="#fff" />
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => handleSetDefault(method.id)}
                  style={({ pressed }) => [styles.actionPill, pressed && styles.buttonPressed]}
                  android_ripple={{ color: Colors.neutral[200] }}>
                  <Text style={styles.actionText}>{method.isDefault ? 'Default' : 'Set Default'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleEditMethod(method)}
                  style={({ pressed }) => [styles.actionPill, pressed && styles.buttonPressed]}
                  android_ripple={{ color: Colors.neutral[200] }}>
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteMethod(method.id)}
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
          <Text style={styles.sectionTitle}>{isFormOpen ? editingMethodId ? 'Edit Payment Method' : 'Add Payment Method' : 'Manage Payment Methods'}</Text>
          <Pressable
            onPress={openNewMethodForm}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            android_ripple={{ color: Colors.neutral[200] }}>
            <Plus size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>Add Method</Text>
          </Pressable>
        </View>

        {isFormOpen ? (
          <View style={styles.formCard}>
            <View style={styles.methodTypeRow}>
              {(['upi', 'card', 'cod'] as PaymentMethodType[]).map(type => (
                <Pressable
                  key={type}
                  onPress={() => setMethodType(type)}
                  style={({ pressed }) => [
                    styles.methodTypeOption,
                    methodType === type && styles.methodTypeOptionActive,
                    pressed && styles.buttonPressed,
                  ]}
                  android_ripple={{ color: Colors.neutral[200] }}>
                  <Text style={[styles.methodTypeLabel, methodType === type && styles.methodTypeLabelActive]}>{type === 'upi' ? 'UPI' : type === 'card' ? 'Card' : 'Cash'}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Method label (e.g. My UPI)"
              placeholderTextColor={Colors.neutral[400]}
              style={styles.textInput}
            />
            {methodType === 'upi' && (
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="UPI ID"
                placeholderTextColor={Colors.neutral[400]}
                style={styles.textInput}
              />
            )}
            {methodType === 'card' && (
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Card ending 1234"
                placeholderTextColor={Colors.neutral[400]}
                style={styles.textInput}
              />
            )}
            {methodType === 'cod' && (
              <Text style={styles.sectionText}>Cash on Delivery will be available at checkout without extra details.</Text>
            )}
            <Pressable
              onPress={handleSaveMethod}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              android_ripple={{ color: Colors.neutral[200] }}>
              <Text style={styles.primaryButtonText}>{editingMethodId ? 'Update Method' : 'Save Method'}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.sectionText}>Add methods to speed up checkout and ensure the best payment flow.</Text>
        )}
      </View>

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
  methodCard: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  methodText: {
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
  methodTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  methodTypeOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[50],
    alignItems: 'center',
  },
  methodTypeOptionActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  methodTypeLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Medium',
  },
  methodTypeLabelActive: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
  sectionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.sm,
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
});
