import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Bug, Sparkles, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';

const SUPPORT_EMAIL = 'support@localeats.com';
const BUG_REPORTS_KEY = 'localeats_help_bug_reports';
const FEATURE_REQUESTS_KEY = 'localeats_help_feature_requests';

type SupportType = 'bug' | 'feature';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    id: 'order',
    question: 'How do I place an order?',
    answer: 'Browse restaurants, add items to your cart, then complete checkout from the cart screen. You can review your order before payment.',
  },
  {
    id: 'track',
    question: 'How do I track my order?',
    answer: 'Open the Order History screen to view your active order status and track delivery updates in real time.',
  },
  {
    id: 'register',
    question: 'How do I register a restaurant?',
    answer: 'Go to Merchant Portal from your profile, then complete the restaurant registration form with your restaurant details.',
  },
  {
    id: 'manage',
    question: 'How do I manage my menu?',
    answer: 'Use the Manage Menu option inside the Merchant Portal to add, edit, or remove menu items for your restaurant.',
  },
  {
    id: 'promotions',
    question: 'How do promotions work?',
    answer: 'Promotions are created in the Merchant Portal and will automatically appear to customers when your offer is active.',
  },
];

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

function persistSupportSubmission(type: SupportType, message: string) {
  const key = type === 'bug' ? BUG_REPORTS_KEY : FEATURE_REQUESTS_KEY;
  const raw = safeLocalStorageGet(key);
  const current = raw ? (JSON.parse(raw) as Array<{ message: string; createdAt: string }>) : [];
  current.unshift({ message, createdAt: new Date().toISOString() });
  safeLocalStorageSet(key, JSON.stringify(current));
}

export default function HelpSupportScreen() {
  const [bugDescription, setBugDescription] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [bugMessage, setBugMessage] = useState('');
  const [featureMessage, setFeatureMessage] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string[]>([]);

  const handleCopyEmail = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(SUPPORT_EMAIL);
      } else {
        safeLocalStorageSet('localeats_clipboard_fallback', SUPPORT_EMAIL);
      }
      setCopyFeedback('Copied to clipboard!');
      setTimeout(() => setCopyFeedback(''), 2500);
    } catch (error) {
      Alert.alert('Copy failed', 'Could not copy the support email. Please copy it manually.');
    }
  };

  const handleSubmit = (type: SupportType) => {
    const text = type === 'bug' ? bugDescription.trim() : featureDescription.trim();
    if (!text) {
      Alert.alert('Required Field', type === 'bug' ? 'Please describe the bug before submitting.' : 'Please describe the feature request before submitting.');
      return;
    }

    persistSupportSubmission(type, text);
    if (type === 'bug') {
      setBugDescription('');
      setBugMessage('Bug report saved locally.');
    } else {
      setFeatureDescription('');
      setFeatureMessage('Feature request saved locally.');
    }

    Alert.alert('Thank you!', type === 'bug' ? 'Your bug report has been saved locally and will help us improve the app.' : 'Your feature request has been saved locally and will be reviewed by the team.');
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
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
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>Need help? We’re here for customers and merchants alike.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MessageSquare size={20} color={Colors.primary[500]} />
          <Text style={styles.sectionTitle}>Contact Support</Text>
        </View>
        <Text style={styles.sectionText}>For urgent issues, email our support team:</Text>
        <View style={styles.emailRow}>
          <Text style={styles.emailText}>{SUPPORT_EMAIL}</Text>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
            onPress={handleCopyEmail}
            android_ripple={{ color: Colors.neutral[200] }}>
            <Copy size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Copy Email</Text>
          </Pressable>
        </View>
        {copyFeedback ? <Text style={styles.successText}>{copyFeedback}</Text> : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Bug size={20} color={Colors.error} />
          <Text style={styles.sectionTitle}>Report a Bug</Text>
        </View>
        <Text style={styles.sectionText}>Tell us what went wrong so we can fix it.</Text>
        <TextInput
          value={bugDescription}
          onChangeText={setBugDescription}
          multiline
          placeholder="Describe the issue in detail..."
          placeholderTextColor={Colors.neutral[400]}
          style={styles.textInput}
          textAlignVertical="top"
        />
        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}
          onPress={() => handleSubmit('bug')}
          android_ripple={{ color: Colors.neutral[200] }}>
          <Text style={styles.submitButtonText}>Submit Bug Report</Text>
        </Pressable>
        {bugMessage ? <Text style={styles.successText}>{bugMessage}</Text> : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Sparkles size={20} color={Colors.primary[500]} />
          <Text style={styles.sectionTitle}>Request a Feature</Text>
        </View>
        <Text style={styles.sectionText}>Share ideas to make LocalEats better.</Text>
        <TextInput
          value={featureDescription}
          onChangeText={setFeatureDescription}
          multiline
          placeholder="Describe the feature you’d like to see..."
          placeholderTextColor={Colors.neutral[400]}
          style={styles.textInput}
          textAlignVertical="top"
        />
        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}
          onPress={() => handleSubmit('feature')}
          android_ripple={{ color: Colors.neutral[200] }}>
          <Text style={styles.submitButtonText}>Submit Feature Request</Text>
        </Pressable>
        {featureMessage ? <Text style={styles.successText}>{featureMessage}</Text> : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        </View>
        {faqItems.map(item => {
          const expanded = expandedFaq.includes(item.id);
          return (
            <View key={item.id} style={styles.faqItem}>
              <Pressable
                onPress={() => toggleFaq(item.id)}
                style={({ pressed }) => [styles.faqQuestionRow, pressed && styles.buttonPressed]}
                android_ripple={{ color: Colors.neutral[200] }}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {expanded ? <ChevronUp size={18} color={Colors.primary[500]} /> : <ChevronDown size={18} color={Colors.primary[500]} />}
              </Pressable>
              {expanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
            </View>
          );
        })}
      </View>

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
  sectionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  emailText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontFamily: 'Inter-Medium',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[500],
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  textInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.neutral[50],
    color: Colors.text,
    fontSize: FontSizes.md,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  successText: {
    marginTop: Spacing.sm,
    color: Colors.success,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Medium',
  },
  faqItem: {
    marginTop: Spacing.sm,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
  faqAnswer: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
