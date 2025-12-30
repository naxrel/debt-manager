import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// --- DESIGN TOKENS ---
const COLORS = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
};

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // --- STATE ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI Focus State
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  // Errors
  const [errors, setErrors] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });

  // --- LOGIC PRESERVED ---
  const handleChangePassword = () => {
    const newErrors = { 
      currentPassword: '', 
      newPassword: '', 
      confirmPassword: '' 
    };
    let hasError = false;

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      hasError = true;
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
      hasError = true;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      hasError = true;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation is required';
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    // Simulate API Call / Success
    Alert.alert('Success', 'Password has been updated successfully', [
      {
        text: 'OK',
        onPress: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={10}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* HERO ICON */}
        <View style={styles.heroSection}>
            <View style={styles.heroIconCircle}>
                <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.heroTitle}>Change Password</Text>
            <Text style={styles.heroSubtitle}>
                Create a strong password to keep your account secure.
            </Text>
        </View>

        {/* FORM CARD */}
        <View style={styles.formCard}>

          {/* 1. Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'currentPassword' && styles.inputWrapperFocused,
              errors.currentPassword ? styles.inputWrapperError : null
            ]}>
              <View style={styles.iconContainer}>
                  <Ionicons 
                    name="key-outline" 
                    size={20} 
                    color={focusedInput === 'currentPassword' ? COLORS.primary : COLORS.textTertiary} 
                  />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor={COLORS.textTertiary}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (errors.currentPassword) setErrors({ ...errors, currentPassword: '' });
                }}
                onFocus={() => setFocusedInput('currentPassword')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIcon}
                hitSlop={10}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSec}
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword ? <Text style={styles.errorText}>{errors.currentPassword}</Text> : null}
          </View>

          {/* 2. New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'newPassword' && styles.inputWrapperFocused,
              errors.newPassword ? styles.inputWrapperError : null
            ]}>
              <View style={styles.iconContainer}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={focusedInput === 'newPassword' ? COLORS.primary : COLORS.textTertiary} 
                  />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={COLORS.textTertiary}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                }}
                onFocus={() => setFocusedInput('newPassword')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
                hitSlop={10}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSec}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : (
                <Text style={styles.hintText}>Minimum 6 characters with letters & numbers.</Text>
            )}
          </View>

          {/* 3. Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'confirmPassword' && styles.inputWrapperFocused,
              errors.confirmPassword ? styles.inputWrapperError : null
            ]}>
              <View style={styles.iconContainer}>
                  <Ionicons 
                    name="checkbox-outline" 
                    size={20} 
                    color={focusedInput === 'confirmPassword' ? COLORS.primary : COLORS.textTertiary} 
                  />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor={COLORS.textTertiary}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                onFocus={() => setFocusedInput('confirmPassword')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                hitSlop={10}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSec}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Update Password</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },
  
  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '20', // 20% opacity
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textSec,
    textAlign: 'center',
    maxWidth: '70%',
    lineHeight: 20,
  },

  // Form Card
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5, // Android Shadow
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
    marginBottom: 8,
  },
  
  // Input Styles
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5, // Keep same width to prevent layout shift
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textMain,
    fontFamily: Font.regular,
    height: '100%',
  },
  eyeIcon: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  
  // Text Helpers
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    fontFamily: Font.regular,
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: Font.regular,
    marginTop: 6,
    marginLeft: 4,
  },

  // Button
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#FFFFFF',
  },
});