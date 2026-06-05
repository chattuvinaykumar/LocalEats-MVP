import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { Mail, Lock, User } from 'lucide-react-native';

interface AuthFormProps {
  type: 'login' | 'signup';
  onSubmit: (email: string, password: string, fullName?: string) => Promise<void>;
  isLoading: boolean;
}

export default function AuthForm({ type, onSubmit, isLoading }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handlePress = () => {
    if (!email || !password || (type === 'signup' && !fullName)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    onSubmit(email, password, type === 'signup' ? fullName : undefined);
  };

  return (
    <View style={styles.container}>
      {type === 'signup' && (
        <View style={styles.inputContainer}>
          <User size={20} color={Colors.neutral[400]} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <Mail size={20} color={Colors.neutral[400]} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Lock size={20} color={Colors.neutral[400]} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {type === 'login' ? 'Sign In' : 'Create Account'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: Colors.primary[500],
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});
