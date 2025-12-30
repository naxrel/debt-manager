import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// --- DESIGN TOKENS (Consistent with App Theme) ---
const COLORS = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  inputBg: '#F8FAFC',    // Slate 50
  danger: '#EF4444',
};

const SPACING = 24;

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  // --- LOGIC PRESERVED 100% ---
  const handleRegister = async () => {
    if (!username || !password || !name || !email) {
      if (Platform.OS === 'web') {
        window.alert('Error\n\nSilakan isi semua field');
      } else {
        Alert.alert('Error', 'Silakan isi semua field');
      }
      return;
    }

    if (password !== confirmPassword) {
      if (Platform.OS === 'web') {
        window.alert('Error\n\nPassword tidak sama');
      } else {
        Alert.alert('Error', 'Password tidak sama');
      }
      return;
    }
    
    if (password.length < 6) {
      if (Platform.OS === 'web') {
        window.alert('Error\n\nPassword minimal 6 karakter');
      } else {
        Alert.alert('Error', 'Password minimal 6 karakter');
      }
      return;
    }
    if (username.length < 5) {
      if (Platform.OS === 'web') {
        window.alert('Error\n\nUsername minimal 5 karakter');
      } else {
        Alert.alert('Error', 'Username minimal 5 karakter');
      }
      return;
    }

    setIsLoading(true);
    const success = await register(username, password, name, email);
    setIsLoading(false);

    if (success) {
      if (Platform.OS === 'web') {
        window.alert('Sukses!\n\nAkun berhasil dibuat. Silakan login untuk melanjutkan.');
        router.replace('/auth/login');
      } else {
        Alert.alert('Sukses', 'Akun berhasil dibuat. Silakan login untuk melanjutkan.', [
          { text: 'OK', onPress: () => router.replace('/auth/login') },
        ]);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Registrasi Gagal\n\nUsername sudah digunakan');
      } else {
        Alert.alert('Registrasi Gagal', 'Username sudah digunakan');
      }
    }
  };

  const goToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={router.back} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
             <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path stroke={COLORS.textMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <View style={{marginTop: 20}}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your financial journey with us.</Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: John Doe"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a unique username"
              value={username}
              onChangeText={(text) => setUsername(text.replace(/\s/g, ''))}
              autoCapitalize="none"
              editable={!isLoading}
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-type your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {/* Main Action Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.linkText}>Already have an account?</Text>
            <TouchableOpacity onPress={goToLogin} disabled={isLoading} style={{padding: 4}}>
              <Text style={styles.linkBold}>Log In</Text>
            </TouchableOpacity>
          </View>

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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    paddingHorizontal: SPACING,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 32,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },

  // Form
  formContainer: {
    paddingHorizontal: SPACING,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: Font.bold,
    color: COLORS.textSec,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16, // Modern Squircle
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textMain,
  },
  
  // Button
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    // Modern Glow Shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Font.bold,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  linkText: {
    fontSize: 15,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },
  linkBold: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: Font.bold,
  },
});