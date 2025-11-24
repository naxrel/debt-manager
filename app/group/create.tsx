import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

export default function CreateGroup() {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchError, setSearchError] = useState('');

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

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Nama grup tidak boleh kosong');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Pilih minimal 1 anggota');
      return;
    }

    setIsLoading(true);

    const result = StaticDB.createGroup(
      groupName.trim(),
      description.trim(),
      user!.id,
      selectedMembers
    );

    setIsLoading(false);

    if (result.success) {
      Alert.alert('Berhasil', 'Grup berhasil dibuat', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Gagal membuat grup');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Batal</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Buat Grup Baru</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
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
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
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
  },
  avatarTextSelected: {
    color: '#fff',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberUsername: {
    fontSize: 13,
    color: '#666',
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
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
