import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import Svg, { Circle, Path } from 'react-native-svg';

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = () => {
    // Validasi
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Password baru tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password baru minimal 6 karakter');
      return;
    }

    // TODO: Implement actual password change logic
    Alert.alert('Success', 'Password berhasil diubah', [
      {
        text: 'OK',
        onPress: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#9ca3af"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                {showCurrentPassword ? (
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path stroke="#6b7280" strokeWidth="2" d="M6.887 5.172c.578-.578.867-.868 1.235-1.02S8.898 4 9.716 4h4.61c.826 0 1.239 0 1.61.155.37.155.66.45 1.239 1.037l1.674 1.699c.568.576.852.865 1.002 1.23.149.364.149.768.149 1.578v4.644c0 .818 0 1.226-.152 1.594s-.441.656-1.02 1.235l-1.656 1.656c-.579.579-.867.867-1.235 1.02-.368.152-.776.152-1.594.152H9.7c-.81 0-1.214 0-1.579-.15-.364-.149-.653-.433-1.229-1.001l-1.699-1.674c-.588-.58-.882-.87-1.037-1.24S4 15.152 4 14.326v-4.61c0-.818 0-1.226.152-1.594s.442-.657 1.02-1.235z" />
                    <Path stroke="#6b7280" strokeLinecap="round" strokeWidth="2" d="m8 11 .422.211a8 8 0 0 0 7.156 0L16 11M12 12.5V14M9 12l-.5 1M15 12l.5 1" />
                  </Svg>
                ) : (
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path stroke="#6b7280" strokeWidth="2" d="M12 5c-5.444 0-8.469 4.234-9.544 6.116-.221.386-.331.58-.32.868.013.288.143.476.402.852C3.818 14.694 7.294 19 12 19s8.182-4.306 9.462-6.164c.26-.376.39-.564.401-.852s-.098-.482-.319-.868C20.47 9.234 17.444 5 12 5Z" />
                    <Circle cx="12" cy="12" r="4" fill="#6b7280" />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#9ca3af"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                {showNewPassword ? (
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path stroke="#6b7280" strokeWidth="2" d="M6.887 5.172c.578-.578.867-.868 1.235-1.02S8.898 4 9.716 4h4.61c.826 0 1.239 0 1.61.155.37.155.66.45 1.239 1.037l1.674 1.699c.568.576.852.865 1.002 1.23.149.364.149.768.149 1.578v4.644c0 .818 0 1.226-.152 1.594s-.441.656-1.02 1.235l-1.656 1.656c-.579.579-.867.867-1.235 1.02-.368.152-.776.152-1.594.152H9.7c-.81 0-1.214 0-1.579-.15-.364-.149-.653-.433-1.229-1.001l-1.699-1.674c-.588-.58-.882-.87-1.037-1.24S4 15.152 4 14.326v-4.61c0-.818 0-1.226.152-1.594s.442-.657 1.02-1.235z" />
                    <Path stroke="#6b7280" strokeLinecap="round" strokeWidth="2" d="m8 11 .422.211a8 8 0 0 0 7.156 0L16 11M12 12.5V14M9 12l-.5 1M15 12l.5 1" />
                  </Svg>
                ) : (
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path stroke="#6b7280" strokeWidth="2" d="M12 5c-5.444 0-8.469 4.234-9.544 6.116-.221.386-.331.58-.32.868.013.288.143.476.402.852C3.818 14.694 7.294 19 12 19s8.182-4.306 9.462-6.164c.26-.376.39-.564.401-.852s-.098-.482-.319-.868C20.47 9.234 17.444 5 12 5Z" />
                    <Circle cx="12" cy="12" r="4" fill="#6b7280" />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Must be at least 6 characters.</Text>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path stroke="#6b7280" strokeWidth="2" d="M6.887 5.172c.578-.578.867-.868 1.235-1.02S8.898 4 9.716 4h4.61c.826 0 1.239 0 1.61.155.37.155.66.45 1.239 1.037l1.674 1.699c.568.576.852.865 1.002 1.23.149.364.149.768.149 1.578v4.644c0 .818 0 1.226-.152 1.594s-.441.656-1.02 1.235l-1.656 1.656c-.579.579-.867.867-1.235 1.02-.368.152-.776.152-1.594.152H9.7c-.81 0-1.214 0-1.579-.15-.364-.149-.653-.433-1.229-1.001l-1.699-1.674c-.588-.58-.882-.87-1.037-1.24S4 15.152 4 14.326v-4.61c0-.818 0-1.226.152-1.594s.442-.657 1.02-1.235z" />
                    <Path stroke="#6b7280" strokeLinecap="round" strokeWidth="2" d="m8 11 .422.211a8 8 0 0 0 7.156 0L16 11M12 12.5V14M9 12l-.5 1M15 12l.5 1" />
                  </Svg>
                ) : (
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path stroke="#6b7280" strokeWidth="2" d="M12 5c-5.444 0-8.469 4.234-9.544 6.116-.221.386-.331.58-.32.868.013.288.143.476.402.852C3.818 14.694 7.294 19 12 19s8.182-4.306 9.462-6.164c.26-.376.39-.564.401-.852s-.098-.482-.319-.868C20.47 9.234 17.444 5 12 5Z" />
                    <Circle cx="12" cy="12" r="4" fill="#6b7280" />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: Font.regular,
    color: '#1f2937',
  },
  eyeButton: {
    padding: 16,
  },
  hint: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#9ca3af',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#ffffff',
  },
});
