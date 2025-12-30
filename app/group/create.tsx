import { Font } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Path, Svg, Circle, G } from 'react-native-svg';
import { useAuth } from '../../contexts/AuthContext';
import { StaticDB } from '../../data/staticDatabase';

// --- DESIGN SYSTEM ---
const COLORS = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTertiary: '#94A3B8',
  inputBg: '#F1F5F9',    // Slate 100
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
};

const SPACING = 20;

export default function CreateGroup() {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchError, setSearchError] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);

  // --- LOGIC (UNTOUCHED) ---
  const handleSearchUser = () => {
    if (!searchUsername.trim()) {
      setSearchError('Enter a username to search');
      return;
    }
    const foundUser = StaticDB.getUserByUsername(searchUsername.trim());
    
    if (!foundUser) {
      setSearchError(`Username "${searchUsername}" not found`);
      return;
    }
    if (foundUser.id === user?.id) {
      setSearchError('You are automatically a group member');
      return;
    }
    if (selectedMembers.includes(foundUser.id)) {
      setSearchError('User already added');
      return;
    }
    if (selectedMembers.length + 1 >= StaticDB.MAX_GROUP_MEMBERS) {
      setSearchError(`Maximum ${StaticDB.MAX_GROUP_MEMBERS} members per group`);
      return;
    }
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
      Alert.alert('Permission Denied', 'Access to the gallery is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setGroupImage(result.assets[0].uri);
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Platform.OS === 'web' ? alert('Group name is required') : Alert.alert('Error', 'Group name is required');
      return;
    }
    if (selectedMembers.length === 0) {
      Platform.OS === 'web' ? alert('Select at least 1 member') : Alert.alert('Error', 'Select at least 1 member');
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
        Alert.alert('Success', 'Group created successfully', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } else {
      Platform.OS === 'web' ? alert(result.error) : Alert.alert('Error', result.error || 'Failed to create group');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke={COLORS.textMain} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Picker Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.9} style={styles.imagePickerWrapper}>
              {groupImage ? (
                <Image source={{ uri: groupImage }} style={styles.groupImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <Circle cx="12" cy="13" r="4" stroke={COLORS.primary} strokeWidth="2" />
                  </Svg>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </Svg>
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>Tap to upload group photo</Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Group Info</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Group Name"
                placeholderTextColor={COLORS.textTertiary}
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (Optional)"
                placeholderTextColor={COLORS.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Members Section */}
          <View style={styles.formGroup}>
            <View style={styles.membersHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
              <Text style={styles.memberCount}>
                {selectedMembers.length + 1}/{StaticDB.MAX_GROUP_MEMBERS}
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Find by username (e.g. john)"
                placeholderTextColor={COLORS.textTertiary}
                value={searchUsername}
                onChangeText={(text) => {
                  setSearchUsername(text);
                  setSearchError('');
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchUser}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </Svg>
              </TouchableOpacity>
            </View>
            {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}

            {/* Member List */}
            <View style={styles.memberList}>
              {/* Creator Card */}
              <View style={[styles.memberCard, styles.creatorCard]}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{user?.name} <Text style={styles.youText}>(You)</Text></Text>
                  <Text style={styles.memberUsername}>@{user?.username}</Text>
                </View>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminText}>ADMIN</Text>
                </View>
              </View>

              {/* Added Members */}
              {selectedMembers.map((memberId) => {
                const member = StaticDB.getUserById(memberId);
                if (!member) return null;
                return (
                  <View key={member.id} style={styles.memberCard}>
                    <View style={[styles.memberAvatar, { backgroundColor: COLORS.textMain }]}>
                      <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberUsername}>@{member.username}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => removeMember(member.id)}
                      style={styles.removeButton}
                    >
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
          
          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Bottom Button */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!groupName.trim() || selectedMembers.length === 0 || isLoading) && styles.createButtonDisabled
            ]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0 || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING,
    paddingVertical: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING,
  },
  
  // Image Picker
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  imagePickerWrapper: {
    position: 'relative',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  groupImage: {
    width: 100,
    height: 100,
    borderRadius: 40, // Squircle-like
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.textMain,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  imageHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },

  // Forms
  formGroup: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    fontFamily: Font.regular,
    color: COLORS.textMain,
  },
  textAreaContainer: {
    height: 100,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textMain,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.textMain,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontFamily: Font.regular,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Members
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberCount: {
    fontSize: 13,
    fontFamily: Font.semiBold,
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberList: {
    marginTop: 4,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  creatorCard: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primarySoft,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: Font.bold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
  },
  youText: {
    color: COLORS.textSec,
    fontFamily: Font.regular,
  },
  memberUsername: {
    fontSize: 13,
    color: COLORS.textSec,
    fontFamily: Font.regular,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 6,
  },
  adminText: {
    fontSize: 10,
    fontFamily: Font.bold,
    color: COLORS.primary,
  },
  removeButton: {
    padding: 8,
  },

  // Footer
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Font.bold,
  },
});