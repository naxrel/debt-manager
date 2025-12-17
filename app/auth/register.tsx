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
} from 'react-native';

const COLORS = {
  primary: '#2563eb',
  disabled: '#93c5fd',
  border: '#ddd',
  background: '#f5f5f5',
  inputPlaceholder: '#9ca3af',
  label: '#333',
  white: '#fff',
};

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Register</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
                placeholderTextColor={COLORS.inputPlaceholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                placeholderTextColor={COLORS.inputPlaceholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
                placeholderTextColor={COLORS.inputPlaceholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password of 6 characters or more"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                placeholderTextColor={COLORS.inputPlaceholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password confirmation</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-type your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
                placeholderTextColor={COLORS.inputPlaceholder}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={goToLogin} disabled={isLoading}>
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkBold}>Log In</Text>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: Font.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 25,

  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: COLORS.label,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    fontFamily: Font.regular,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: Font.bold,
  },
  linkText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#666',
  },
  linkBold: {
    color: COLORS.primary,
    fontFamily: Font.bold,
  },
});
