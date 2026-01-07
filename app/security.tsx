import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
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
import Svg, { Circle, Path } from 'react-native-svg';

// --- DESIGN TOKENS ---
const COLORS = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTertiary: '#94A3B8',
  inputBg: '#F1F5F9',    // Slate 100 (Borrowed from Profile)
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
};

const SPACING = 24;

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

  // --- CUSTOM ICONS (SVG) ---
  const IconShield = ({ size = 24, color = COLORS.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );

  const IconEye = ({off, color = COLORS.textSec }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
            <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
        </>
      ) : (
        <>
            <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <Circle cx="12" cy="12" r="3" />
        </>
      )}
    </Svg>
  );

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
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
             <Path stroke={COLORS.textMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
            <View style={styles.heroIconCircle}>
                <IconShield size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.heroTitle}>Protect your account</Text>
            <Text style={styles.heroSubtitle}>
                Choose a strong password securely.
            </Text>
        </View>

        {/* FORM CONTAINER */}
        <View style={styles.formContainer}>

          {/* 1. Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'currentPassword' && styles.inputWrapperFocused,
              errors.currentPassword ? styles.inputWrapperError : null
            ]}>
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
                style={styles.eyeBtn}
                hitSlop={12}
              >
                 <IconEye off={!showCurrentPassword} />
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
                style={styles.eyeBtn}
                hitSlop={12}
              >
                <IconEye off={!showNewPassword} />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : (
                <Text style={styles.hintText}>Minimum 6 characters.</Text>
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
                style={styles.eyeBtn}
                hitSlop={12}
              >
                <IconEye off={!showConfirmPassword} />
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
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M12 5l7 7-7 7"/>
            </Svg>
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
    paddingHorizontal: SPACING,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 20,
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
    paddingHorizontal: SPACING,
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  heroIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: Font.regular,
    color: COLORS.textSec,
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 22,
  },

  // Form Container (Removed Card Shadow for Clean Look)
  formContainer: {
    marginVertical: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 8,
    marginLeft: 4,
  },
  
  // Input Styles - Modern Filled
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.inputBg, // Filled style
    borderWidth: 1,
    borderColor: 'transparent',
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textMain,
    fontFamily: Font.regular,
    height: '100%',
    paddingLeft: 16, // No icon inside input, cleaner
  },
  eyeBtn: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Text Helpers
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    fontFamily: Font.regular,
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 13,
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
    borderRadius: 16, // Modern rounded
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#FFFFFF',
  },
});