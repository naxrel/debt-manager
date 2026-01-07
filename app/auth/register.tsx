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

// --- MODERN DESIGN TOKENS ---
const COLORS = {
  background: '#F8FAFC', // Slate 50 (Softer than pure white)
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  textMain: '#1E293B',   // Slate 800
  textSec: '#64748B',    // Slate 500
  border: '#E2E8F0',     // Slate 200
  inputBg: '#FFFFFF',
  danger: '#EF4444',
  focus: '#4F46E5',
};

const SPACING = 24;

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State visual untuk UX yang lebih baik (Focus Ring)
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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

  // Helper untuk render input agar code lebih clean
  const renderInput = (
    label: string, 
    value: string, 
    setter: (val: string) => void, 
    placeholder: string,
    key: string,
    secure = false,
    keyboardType: any = 'default',
    autoCap = 'sentences'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputContainer,
        focusedInput === key && styles.inputFocused
      ]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={setter}
          editable={!isLoading}
          placeholderTextColor="#94A3B8"
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCap as any}
          onFocus={() => setFocusedInput(key)}
          onBlur={() => setFocusedInput(null)}
        />
      </View>
    </View>
  );

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
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Begin your financial journey.</Text>
          </View>
        </View>

        {/* Form Section - Menggunakan Modern Card Style tapi flat menyatu dengan background */}
        <View style={styles.formContainer}>
          
          {renderInput('Full Name', name, setName, 'Ex: John Doe', 'name')}
          {renderInput('Email Address', email, setEmail, 'hello@example.com', 'email', false, 'email-address', 'none')}
          {renderInput('Username', username, (t) => setUsername(t.replace(/\s/g, '')), 'Unique username', 'username', false, 'default', 'none')}
          {renderInput('Password', password, setPassword, 'Min. 6 characters', 'password', true)}
          {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'Re-type password', 'confirm', true)}

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
            <TouchableOpacity onPress={goToLogin} disabled={isLoading}>
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
  
  // Header Styles
  header: {
    paddingHorizontal: SPACING,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTextContainer: {
    gap: 8,
  },
  title: {
    fontSize: 34,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textSec,
    lineHeight: 24,
  },

  // Form Styles
  formContainer: {
    paddingHorizontal: SPACING,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    // Smooth transition simulation
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF', // Very subtle tint
  },
  input: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textMain,
    height: '100%',
  },
  
  // Button Styles
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Font.bold,
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
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