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
  View
} from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    // Input validation
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
      // Web-compatible error handling
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="wallet-outline" size={48} color="#2563eb" />
            </View>
            <Text style={styles.title}>deBT</Text>
            <Text style={styles.subtitle}>Easily manage debt with your friends!</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={[
                styles.inputWrapper,
                focusedInput === 'username' && styles.inputWrapperFocused,
                errors.username && styles.inputWrapperError
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={focusedInput === 'username' ? '#2563eb' : '#9ca3af'} 
                  style={styles.inputIcon}
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
                />
              </View>
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                focusedInput === 'password' && styles.inputWrapperFocused,
                errors.password && styles.inputWrapperError
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={focusedInput === 'password' ? '#2563eb' : '#9ca3af'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputPassword]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
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
                <>
                  <Text style={styles.buttonText}>Log In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Demo Accounts */}
            <View style={styles.demoContainer}>
              <View style={styles.demoHeader}>
                <Ionicons name="information-circle-outline" size={16} color="#1e40af" />
                <Text style={styles.demoTitle}>Akun Demo</Text>
              </View>
              <Text style={styles.demoSubtitle}>Tap untuk mengisi otomatis</Text>
              
              <TouchableOpacity 
                style={styles.demoItem}
                onPress={() => fillDemoAccount('admin', 'admin123')}
                disabled={isLoading}
              >
                <View style={styles.demoItemLeft}>
                  <Ionicons name="person-circle-outline" size={18} color="#3b82f6" />
                  <View style={styles.demoItemText}>
                    <Text style={styles.demoUsername}>admin</Text>
                    <Text style={styles.demoPassword}>admin123</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.demoItem}
                onPress={() => fillDemoAccount('john', 'john123')}
                disabled={isLoading}
              >
                <View style={styles.demoItemLeft}>
                  <Ionicons name="person-circle-outline" size={18} color="#3b82f6" />
                  <View style={styles.demoItemText}>
                    <Text style={styles.demoUsername}>john</Text>
                    <Text style={styles.demoPassword}>john123</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.demoItem}
                onPress={() => fillDemoAccount('jane', 'jane123')}
                disabled={isLoading}
              >
                <View style={styles.demoItemLeft}>
                  <Ionicons name="person-circle-outline" size={18} color="#3b82f6" />
                  <View style={styles.demoItemText}>
                    <Text style={styles.demoUsername}>jane</Text>
                    <Text style={styles.demoPassword}>jane123</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {/* Register Link */}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontFamily: Font.bold,
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: Font.regular,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#1e293b',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: '#2563eb',
    backgroundColor: '#f8fafc',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 0,
  },
  inputPassword: {
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.bold,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  demoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 6,
  },
  demoSubtitle: {
    fontSize: 12,
    color: '#3b82f6',
    marginBottom: 12,
    marginLeft: 22,
  },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  demoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  demoItemText: {
    marginLeft: 10,
  },
  demoUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  demoPassword: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  registerLink: {
    marginTop: 20,
  },
  linkText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#64748b',
  },
  linkBold: {
    color: '#2563eb',
    fontFamily: Font.bold,
  },
});