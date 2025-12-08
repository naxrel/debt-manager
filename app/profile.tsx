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
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);

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
      Alert.alert('Berhasil', 'Profile berhasil diperbarui', [
        {
          text: 'OK',
          onPress: () => {
            setIsEditing(false);
          },
        },
      ]);
    } else {
      Alert.alert('Error', 'Gagal memperbarui profile');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Akses ke galeri diperlukan untuk mengganti foto profile');
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={isEditing ? handlePickImage : undefined}
              disabled={!isEditing}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {isEditing && (
                <View style={styles.editImageOverlay}>
                  <Text style={styles.editImageText}>📷</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#9ca3af"
                />
              ) : (
                <Text style={styles.infoValue}>{user.name}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>@{user.username}</Text>
              <Text style={styles.infoHint}>Username cannot be changed</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
              <Text style={styles.infoHint}>Email cannot be changed</Text>
            </View>
          </View>

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
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    paddingTop: 50,
    borderBottomWidth: 0,
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
    paddingLeft: 18,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#2563eb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: Font.bold,
    color: '#ffffff',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageText: {
    fontSize: 20,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#6b7280',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: '#1f2937',
  },
  infoHint: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#9ca3af',
    marginTop: 4,
  },
  input: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#6b7280',
  },
});
