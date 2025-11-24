import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { StaticDB } from '@/data/staticDatabase';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);

  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Nama tidak boleh kosong');
      return;
    }

    // Update user data including profile image
    const result = StaticDB.updateUser(user.id, { 
      name: name.trim(),
      profileImage: profileImage || undefined
    });
    
    if (result) {
      // Refresh user data in context
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  setName(user.name);
                }}
              >
                <Text style={styles.cancelButton}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveButton}>Simpan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={isEditing ? handlePickImage : undefined}
            disabled={!isEditing}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isEditing && (
              <View style={styles.editIconContainer}>
                <Text style={styles.editIcon}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.usernameNote}>Username tidak dapat diubah</Text>
        </View>

        {/* Profile Form */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.valueText}>{user.name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.valueText}>{user.email}</Text>
            <Text style={styles.noteText}>Email belum terverifikasi</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.valueText}>@{user.username}</Text>
            <Text style={styles.noteText}>Username tidak dapat diubah</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistik Saya</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {StaticDB.getUserGroups(user.id).length}
              </Text>
              <Text style={styles.statLabel}>Grup Aktif</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {StaticDB.getDebtsByUserId(user.id).length}
              </Text>
              <Text style={styles.statLabel}>Hutang Personal</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  editButton: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  editIcon: {
    fontSize: 18,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  usernameNote: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  valueText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  logoutButton: {
    marginHorizontal: 20,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
