import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { StaticDB } from '@/data/staticDatabase';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
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
import Svg, { Path, Circle, G } from 'react-native-svg';

// --- DESIGN TOKENS ---
const COLORS = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTertiary: '#94A3B8',
  inputBg: '#F1F5F9',
  border: '#E2E8F0',
  danger: '#EF4444',
};

const SPACING = 20;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);

  // --- LOGIC PRESERVED ---
  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Nama tidak boleh kosong');
      return;
    }

    const result = StaticDB.updateUser(user.id, {
      name: name.trim(),
      profileImage: profileImage || undefined,
    });

    if (result) {
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            setIsEditing(false);
          },
        },
      ]);
    } else {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handlePickImage = async () => {
    if (!isEditing) return; // Prevent picking if not editing

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to change profile photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  if (!user) return null;

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
        
        <Text style={styles.headerTitle}>My Profile</Text>
        
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          style={[
              styles.actionButton,
              isEditing ? styles.actionButtonSave : styles.actionButtonEdit
          ]}
        >
          <Text style={[
              styles.actionButtonText,
              isEditing ? { color: '#FFF' } : { color: COLORS.primary }
          ]}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* HERO SECTION: IMAGE */}
          <View style={styles.heroSection}>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={handlePickImage}
              activeOpacity={isEditing ? 0.8 : 1}
              disabled={!isEditing}
            >
              <View style={[styles.imageWrapper, isEditing && styles.imageWrapperEditing]}>
                {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>
                        {user.name.charAt(0).toUpperCase()}
                    </Text>
                    </View>
                )}
              </View>

              {/* Camera Icon Overlay (Only Visible in Edit Mode) */}
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <Circle cx="12" cy="13" r="4" stroke="#FFF" strokeWidth="2" />
                  </Svg>
                </View>
              )}
            </TouchableOpacity>
            
            {!isEditing && (
                <View style={{alignItems: 'center', marginTop: 16}}>
                    <Text style={styles.heroName}>{user.name}</Text>
                    <Text style={styles.heroUsername}>@{user.username}</Text>
                </View>
            )}
          </View>

          {/* FORM SECTION */}
          <View style={styles.formCard}>
            
            {/* Field: Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.textTertiary}
                />
              ) : (
                <View style={styles.readOnlyContainer}>
                    <Text style={styles.readOnlyText}>{user.name}</Text>
                </View>
              )}
            </View>

            {/* Field: Username (Locked) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.readOnlyContainer, styles.lockedContainer]}>
                <Text style={[styles.readOnlyText, styles.lockedText]}>@{user.username}</Text>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a7 7 0 0 0-14 0v2" />
                </Svg>
              </View>
            </View>

            {/* Field: Email (Locked) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.readOnlyContainer, styles.lockedContainer]}>
                <Text style={[styles.readOnlyText, styles.lockedText]}>{user.email}</Text>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a7 7 0 0 0-14 0v2" />
                </Svg>
              </View>
            </View>

          </View>

          {/* CANCEL BUTTON */}
          {isEditing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setName(user.name);
                setProfileImage(user.profileImage || null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel Changes</Text>
            </TouchableOpacity>
          )}
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
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonEdit: {
    backgroundColor: COLORS.primarySoft,
  },
  actionButtonSave: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Font.bold,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING,
  },

  // Hero Image
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    // FIX: Mengganti padding dengan borderWidth untuk menghilangkan border kotak
    borderWidth: 4, 
    borderColor: COLORS.surface,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible', // Pastikan shadow tetap terlihat
  },
  imageWrapperEditing: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60, // Sesuaikan dengan parent
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
    fontFamily: Font.bold,
    color: '#ffffff',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.textMain,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  heroName: {
    fontSize: 24,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 4,
  },
  heroUsername: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },

  // Form
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: COLORS.textSec,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textMain,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  readOnlyContainer: {
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyText: {
    fontSize: 18,
    fontFamily: Font.regular,
    color: COLORS.textMain,
  },
  lockedContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingVertical: 10,
  },
  lockedText: {
    fontSize: 16,
    color: COLORS.textTertiary,
  },

  // Buttons
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: Font.bold,
    color: COLORS.danger,
  },
});