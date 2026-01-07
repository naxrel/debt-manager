import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
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

// Reuse COLORS for consistency
const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#2563EB', // Blue 600
  textMain: '#0F172A',
  textSec: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
};

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const router = useRouter();
  const { login } = useAuth();

  // --- LOGIC PRESERVED 100% ---
  const handleLogin = async () => {
    const newErrors = { username: '', password: '' };
    let hasError = false;

    if (!username.trim()) {
      newErrors.username = 'Username tidak boleh kosong';
      hasError = true;
    }

    if (!password) {
      newErrors.password = 'Password tidak boleh kosong';
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return;
    }

    setIsLoading(true);
    const success = await login(username.trim(), password);
    setIsLoading(false);

    if (success) {
      router.replace('/(tabs)/home');
    } else {
      if (Platform.OS === 'web') {
        window.alert('Login gagal!\n\nUsername atau password salah. Silakan coba lagi.');
      } else {
        Alert.alert(
          'Login Gagal', 
          'Username atau password salah. Silakan coba lagi.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const fillDemoAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrors({ username: '', password: '' });
  };

  const goToRegister = () => {
    router.push('/auth/register');
  };

  const goToOnboarding = () => {
    router.push('/onboarding');
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
        <View style={styles.paddingWrapper}>
          
          {/* Top Bar */}
          <TouchableOpacity 
            onPress={goToOnboarding}
            style={styles.topBackBtn}
            activeOpacity={0.6}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textSec} />
            <Text style={styles.topBackText}>Onboarding</Text>
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="wallet" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to manage your debts.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <View style={[
                styles.inputWrapper,
                focusedInput === 'username' && styles.inputWrapperFocused,
                errors.username ? styles.inputWrapperError : null
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={focusedInput === 'username' ? COLORS.primary : '#94A3B8'} 
                />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) setErrors({ ...errors, username: '' });
                  }}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  editable={!isLoading}
                  placeholder="Enter your username"
                  placeholderTextColor="#CBD5E1"
                />
              </View>
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={[
                styles.inputWrapper,
                focusedInput === 'password' && styles.inputWrapperFocused,
                errors.password ? styles.inputWrapperError : null
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={focusedInput === 'password' ? COLORS.primary : '#94A3B8'} 
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  placeholder="••••••••"
                  placeholderTextColor="#CBD5E1"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

          </View>

          {/* Demo Accounts - Styled as Quick Access Chips */}
          <View style={styles.demoSection}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>QUICK DEMO ACCESS</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.demoChipsContainer}>
              {['admin', 'john', 'jane'].map((user, idx) => (
                <TouchableOpacity 
                  key={user}
                  style={styles.demoChip}
                  onPress={() => fillDemoAccount(user, user + '123')}
                  disabled={isLoading}
                >
                  <View style={[styles.demoAvatar, { backgroundColor: idx === 0 ? '#DBEAFE' : '#F1F5F9' }]}>
                     <Text style={[styles.demoAvatarText, { color: idx === 0 ? COLORS.primary : COLORS.textSec }]}>
                        {user.charAt(0).toUpperCase()}
                     </Text>
                  </View>
                  <View>
                    <Text style={styles.demoName}>{user}</Text>
                    <Text style={styles.demoPass}>{user}123</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer Link */}
          <TouchableOpacity 
            onPress={goToRegister} 
            disabled={isLoading}
            style={styles.registerLink}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  paddingWrapper: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
  },
  
  // Top Navigation
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  topBackText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textSec,
    marginLeft: 4,
  },

  // Header
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  title: {
    fontSize: 28,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSec,
    fontFamily: Font.regular,
  },

  // Card & Form
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    // Modern Box Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: Font.bold,
    color: COLORS.textSec,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#fff',
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textMain,
    marginLeft: 12,
    fontFamily: Font.regular,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
    fontFamily: Font.regular,
  },
  
  // Buttons
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.bold,
  },

  // Demo Section
  demoSection: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: Font.bold,
    letterSpacing: 1,
  },
  demoChipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  demoChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  demoAvatarText: {
    fontSize: 14,
    fontFamily: Font.bold,
  },
  demoName: {
    fontSize: 12,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 2,
  },
  demoPass: {
    fontSize: 10,
    color: COLORS.textSec,
  },

  // Footer Link
  registerLink: {
    alignSelf: 'center',
    padding: 10,
  },
  linkText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },
  linkBold: {
    color: COLORS.primary,
    fontFamily: Font.bold,
  },
});