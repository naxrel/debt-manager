import { Font } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { StaticDB } from '../../data/staticDatabase';
import { Path, Svg } from 'react-native-svg';
export default function CreateGroup() {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchError, setSearchError] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);

  const handleSearchUser = () => {
    if (!searchUsername.trim()) {
      setSearchError('Masukkan username');
      return;
    }

    const foundUser = StaticDB.getUserByUsername(searchUsername.trim());
    
    if (!foundUser) {
      setSearchError(`Username "${searchUsername}" tidak ditemukan`);
      return;
    }

    if (foundUser.id === user?.id) {
      setSearchError('Anda otomatis menjadi anggota grup');
      return;
    }

    if (selectedMembers.includes(foundUser.id)) {
      setSearchError('User sudah ditambahkan');
      return;
    }

    if (selectedMembers.length + 1 >= StaticDB.MAX_GROUP_MEMBERS) {
      setSearchError(`Maksimum ${StaticDB.MAX_GROUP_MEMBERS} anggota per grup (termasuk Anda)`);
      return;
    }

    // Add member
    setSelectedMembers(prev => [...prev, foundUser.id]);
    setSearchUsername('');
    setSearchError('');
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(id => id !== userId));
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Akses ke galeri diperlukan untuk mengganti foto grup');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // Balance antara kualitas & ukuran file
    });

    if (!result.canceled) {
      // Check file size (max 2MB)
      const asset = result.assets[0];
      // Note: Expo ImagePicker tidak langsung memberikan file size
      // Dalam production, bisa tambahkan validasi dengan FileSystem
      setGroupImage(asset.uri);
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      if (Platform.OS === 'web') {
        alert('Nama grup tidak boleh kosong');
      } else {
        Alert.alert('Error', 'Nama grup tidak boleh kosong');
      }
      return;
    }

    if (selectedMembers.length === 0) {
      if (Platform.OS === 'web') {
        alert('Pilih minimal 1 anggota');
      } else {
        Alert.alert('Error', 'Pilih minimal 1 anggota');
      }
      return;
    }

    setIsLoading(true);

    const result = StaticDB.createGroup(
      groupName.trim(),
      description.trim(),
      user!.id,
      selectedMembers,
      groupImage || undefined
    );

    setIsLoading(false);

    if (result.success) {
      if (Platform.OS === 'web') {
        alert('Grup berhasil dibuat');
        router.back();
      } else {
        Alert.alert('Berhasil', 'Grup berhasil dibuat', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Gagal membuat grup');
      } else {
        Alert.alert('Error', result.error || 'Gagal membuat grup');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
                    style={styles.backButton}
                    activeOpacity={0.7}
                  >
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
                    </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>Create new group</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Profile Picture */}
        <View style={styles.section}>
          <Text style={styles.label}>Foto Profil Grup (Opsional)</Text>
          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            {groupImage ? (
              <Image source={{ uri: groupImage }} style={styles.groupImagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderEmoji}>👥</Text>
                <Text style={styles.placeholderText}>Tap untuk pilih foto</Text>
              </View>
            )}
          </TouchableOpacity>
          {groupImage && (
            <TouchableOpacity
              onPress={() => setGroupImage(null)}
              style={styles.removeImageButton}
              activeOpacity={0.7}
            >
              <Text style={styles.removeImageText}>Hapus Foto</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nama Grup *</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Tim Project, Liburan Bali"
            placeholderTextColor="#999"
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Deskripsi grup (opsional)"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Tambah Anggota * ({selectedMembers.length + 1}/{StaticDB.MAX_GROUP_MEMBERS})
          </Text>
          <Text style={styles.hint}>
            Anda otomatis menjadi anggota grup ini. Cari user berdasarkan username.
          </Text>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari username (contoh: john)"
              placeholderTextColor="#999"
              value={searchUsername}
              onChangeText={(text) => {
                setSearchUsername(text);
                setSearchError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchUser}
              activeOpacity={0.7}
            >
              <Text style={styles.searchButtonText}>Cari</Text>
            </TouchableOpacity>
          </View>

          {searchError ? (
            <Text style={styles.errorText}>{searchError}</Text>
          ) : null}

          {/* Current user */}
          <View style={[styles.memberItem, styles.memberItemDisabled]}>
            <View style={styles.memberInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.memberName}>{user?.name}</Text>
                <Text style={styles.memberUsername}>@{user?.username}</Text>
              </View>
            </View>
            <View style={styles.badgeCreator}>
              <Text style={styles.badgeText}>Anda (Creator)</Text>
            </View>
          </View>

          {/* Selected members */}
          {selectedMembers.map(memberId => {
            const member = StaticDB.getUserById(memberId);
            if (!member) return null;
            return (
              <View
                key={member.id}
                style={[styles.memberItem, styles.memberItemSelected]}
              >
                <View style={styles.memberInfo}>
                  <View style={[styles.avatar, styles.avatarSelected]}>
                    <Text style={[styles.avatarText, styles.avatarTextSelected]}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberUsername}>@{member.username}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => removeMember(member.id)}
                  style={styles.removeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!groupName.trim() || selectedMembers.length === 0 || isLoading) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || selectedMembers.length === 0 || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>
              Buat Grup ({selectedMembers.length + 1} anggota)
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    alignItems: 'flex-start',
    paddingLeft: 2,
    cursor: 'pointer' as any,
  },
  title: {
    fontSize: 18,
    paddingLeft: 12,
    fontFamily: Font.semiBold,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontFamily: Font.semiBold,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: Font.regular,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Biennale-Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  memberItemDisabled: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSelected: {
    backgroundColor: '#007AFF',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Biennale-SemiBold',
  },
  avatarTextSelected: {
    color: '#fff',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Biennale-SemiBold',
  },
  memberUsername: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Biennale-Regular',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Biennale-Bold',
  },
  badgeCreator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Biennale-SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    fontFamily: 'Biennale-Regular',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Biennale-SemiBold',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
    fontFamily: 'Biennale-Regular',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Biennale-Bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Biennale-SemiBold',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  groupImagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
    fontFamily: 'Biennale-Regular',
  },
  placeholderText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Biennale-Regular',
  },
  removeImageButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    alignSelf: 'center',
  },
  removeImageText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Biennale-SemiBold',
  },
});
