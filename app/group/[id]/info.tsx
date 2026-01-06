import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur'; // Penting untuk efek modern
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal Imports
import { CustomToast } from '@/components/CustomToast';
import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DebtGroup, StaticDB } from '@/data/staticDatabase';

// --- 1. MODERN DESIGN TOKENS ---
const COLORS = {
  bg: '#F8FAFC',        // Slate 50 (Ultra Light Grey for Background)
  surface: '#FFFFFF',   // Pure White
  primary: '#6366F1',   // Indigo 500
  primarySoft: '#E0E7FF', // Indigo 100
  textMain: '#1E293B',  // Slate 800
  textSec: '#64748B',   // Slate 500
  danger: '#EF4444',    // Red 500
  dangerSoft: '#FEE2E2',// Red 100
  border: '#E2E8F0',    // Slate 200
  inputBg: '#F1F5F9',   // Slate 100
  shadow: '#6366F1',
};

const METRICS = {
  radius: 24,           // Super rounded
  padding: 24,          // Extreme whitespace
  avatarSize: 110,
};

// --- 2. REUSABLE UI COMPONENTS (CLEAN CODE) ---

// Styled Modal Wrapper (Glassmorphism)
const GlassModal = ({ visible, onClose, title, children, type = 'default' }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <BlurView intensity={Platform.OS === 'ios' ? 20 : 100} tint="dark" style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboard}>
        <View style={[styles.modalCard, type === 'danger' && styles.modalCardDanger]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, type === 'danger' && { color: COLORS.danger }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={COLORS.textSec} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>
);

// Member List Item
const MemberItem = ({ member, isCreator, isMe }: any) => (
  <View style={styles.memberCard}>
    <Image 
      source={{ uri: member.profileImage || 'https://via.placeholder.com/100' }} 
      style={styles.memberAvatar} 
    />
    <View style={styles.memberInfo}>
      <Text style={styles.memberName}>
        {member.name} {isMe && <Text style={{ color: COLORS.primary, fontSize: 12 }}> (You)</Text>}
      </Text>
      <Text style={styles.memberUsername}>@{member.username}</Text>
    </View>
    {isCreator && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Admin</Text>
      </View>
    )}
  </View>
);

// --- 3. MAIN COMPONENT ---
export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // --- STATE ---
  const [group, setGroup] = useState<DebtGroup | null>(null);
  const [creator, setCreator] = useState<{ name: string; username: string } | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  // Form States
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupImage, setEditGroupImage] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [formError, setFormError] = useState('');

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  // --- DATA LOADING ---
  const loadData = useCallback(() => {
    if (!id) return;
    const groupData = StaticDB.getGroupById(id);
    if (groupData) {
      setGroup(groupData);
      const creatorData = StaticDB.getUserById(groupData.creatorId);
      if (creatorData) setCreator(creatorData);
      const memberList = groupData.memberIds
        .map(mId => StaticDB.getUserById(mId))
        .filter(m => m !== undefined);
      setMembers(memberList);
    }
    setIsLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // --- ACTIONS ---
  const handlePickGroupImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    });
    if (!result.canceled) {
      setEditGroupImage(result.assets[0].uri);
    }
  };

  const handleSaveEdit = () => {
    if (!group || !editGroupName.trim()) return;
    const result = StaticDB.updateGroup(group.id, {
      name: editGroupName.trim(),
      description: editGroupDescription.trim(),
      groupImage: editGroupImage || undefined
    });
    if (result.success) {
      setShowEditModal(false);
      loadData();
      setToast({ visible: true, message: 'Group updated successfully', type: 'success' });
    }
  };

  const handleInviteMember = () => {
    if (!group || !newMemberUsername.trim()) {
      setFormError('Please enter a username');
      return;
    }
    const foundUser = StaticDB.getUserByUsername(newMemberUsername.trim());
    if (!foundUser) {
      setFormError('Username not found');
      return;
    }
    if (group.memberIds.includes(foundUser.id)) {
      setFormError('User already in group');
      return;
    }
    const result = StaticDB.addMemberToGroup(group.id, foundUser.id);
    if (result.success) {
      setShowAddMemberModal(false);
      setNewMemberUsername('');
      setFormError('');
      loadData();
      setToast({ visible: true, message: `${foundUser.name} added!`, type: 'success' });
    } else {
      setFormError(result.error || 'Failed to add');
    }
  };

  const handleDeleteGroup = () => {
    if (!group) return;
    if (deleteConfirmText !== group.name) {
      setFormError('Group name does not match');
      return;
    }
    const result = StaticDB.deleteGroup(group.id);
    if (result.success) {
      setShowDeleteModal(false);
      router.dismissAll(); 
      router.replace('/(tabs)/group'); 
    } else {
      setFormError(result.error || 'Failed to delete');
    }
  };

  // --- RENDER ---
  if (isLoading || !group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isCreator = user?.id === group.creatorId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. HEADER (Transparent & Float) */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        {isCreator && (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              setEditGroupName(group.name);
              setEditGroupDescription(group.description);
              setEditGroupImage(group.groupImage || null);
              setShowEditModal(true);
            }}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. HERO SECTION (Premium Look) */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            {group.groupImage ? (
              <Image source={{ uri: group.groupImage }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarImage, { backgroundColor: COLORS.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
                 <Text style={{ fontSize: 40, color: COLORS.primary }}>{group.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.avatarShadow} />
          </View>
          
          <Text style={styles.groupTitle}>{group.name}</Text>
          <Text style={styles.groupMeta}>
            Created by <Text style={styles.highlight}>@{creator?.username}</Text>
          </Text>
          
          <View style={styles.descContainer}>
            <Text style={styles.description}>
              {group.description || 'No description provided.'}
            </Text>
          </View>
        </View>

        {/* 3. MEMBERS SECTION (Card Style) */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <View style={styles.pillCount}>
                <Text style={styles.pillText}>{members.length}</Text>
            </View>
        </View>

        <View style={styles.memberList}>
          {members.map((member) => (
            <MemberItem 
                key={member.id} 
                member={member} 
                isCreator={group.creatorId === member.id}
                isMe={member.id === user?.id}
            />
          ))}
        </View>

        {/* 4. FOOTER ACTIONS */}
        <View style={styles.footer}>
            {isCreator && (
                <TouchableOpacity 
                    style={styles.primaryButton} 
                    onPress={() => {
                        setNewMemberUsername('');
                        setFormError('');
                        setShowAddMemberModal(true);
                    }}
                >
                    <Ionicons name="add-circle" size={24} color="#FFF" />
                    <Text style={styles.primaryButtonText}>Invite Member</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity 
                style={styles.textButton} 
                onPress={() => {
                    if (isCreator) {
                        setDeleteConfirmText('');
                        setFormError('');
                        setShowDeleteModal(true);
                    } else {
                        // Logic leave group here
                    }
                }}
            >
                <Text style={[styles.textButtonLabel, { color: COLORS.danger }]}>
                    {isCreator ? 'Delete Group' : 'Leave Group'}
                </Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* --- MODALS REFACTORED --- */}
      
      {/* Edit Modal */}
      <GlassModal visible={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Group">
        <TouchableOpacity style={styles.modalAvatarPicker} onPress={handlePickGroupImage}>
             {editGroupImage ? (
                 <Image source={{ uri: editGroupImage }} style={styles.modalAvatarImage} />
             ) : (
                 <Ionicons name="camera" size={32} color={COLORS.textSec} />
             )}
        </TouchableOpacity>
        <TextInput 
            style={styles.modernInput} 
            value={editGroupName} 
            onChangeText={setEditGroupName} 
            placeholder="Group Name" 
            placeholderTextColor={COLORS.textSec}
        />
        <TextInput 
            style={[styles.modernInput, { height: 100, textAlignVertical: 'top' }]} 
            value={editGroupDescription} 
            onChangeText={setEditGroupDescription} 
            placeholder="Description" 
            placeholderTextColor={COLORS.textSec}
            multiline 
        />
        <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveEdit}>
            <Text style={styles.modalPrimaryBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </GlassModal>

      {/* Invite Modal */}
      <GlassModal visible={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Invite Member">
         <Text style={styles.modalHelperText}>Enter the username to invite them.</Text>
         <TextInput 
            style={styles.modernInput} 
            value={newMemberUsername} 
            onChangeText={(t) => { setNewMemberUsername(t); setFormError(''); }} 
            placeholder="@username" 
            autoCapitalize="none"
            placeholderTextColor={COLORS.textSec}
        />
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleInviteMember}>
            <Text style={styles.modalPrimaryBtnText}>Send Invitation</Text>
        </TouchableOpacity>
      </GlassModal>

      {/* Delete Modal */}
      <GlassModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Group" type="danger">
         <Text style={styles.modalHelperText}>
             Are you sure? This action is permanent. Type <Text style={{fontWeight:'bold', color: COLORS.textMain}}>{group.name}</Text> to confirm.
         </Text>
         <TextInput 
            style={[styles.modernInput, { borderColor: COLORS.dangerSoft, backgroundColor: '#FFF5F5' }]} 
            value={deleteConfirmText} 
            onChangeText={(t) => { setDeleteConfirmText(t); setFormError(''); }} 
            placeholder="Type group name" 
            placeholderTextColor={COLORS.textSec}
        />
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <TouchableOpacity style={[styles.modalPrimaryBtn, { backgroundColor: COLORS.danger }]} onPress={handleDeleteGroup}>
            <Text style={styles.modalPrimaryBtnText}>Delete Permanently</Text>
        </TouchableOpacity>
      </GlassModal>

      <CustomToast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast({ ...toast, visible: false })} 
      />
    </View>
  );
}

// --- 4. STYLESHEET (CLEAN & MODERN) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: METRICS.padding,
  },
  avatarContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  avatarImage: {
    width: METRICS.avatarSize,
    height: METRICS.avatarSize,
    borderRadius: 55, // Circle
    borderWidth: 4,
    borderColor: COLORS.surface,
    zIndex: 2,
  },
  avatarShadow: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    bottom: -10,
    backgroundColor: COLORS.shadow,
    opacity: 0.3,
    borderRadius: 55,
    zIndex: 1,
    transform: [{ scale: 0.9 }],
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  groupTitle: {
    fontSize: 28,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 4,
    textAlign: 'center',
  },
  groupMeta: {
    fontSize: 14,
    color: COLORS.textSec,
    marginBottom: 16,
    fontFamily: Font.regular,
  },
  highlight: {
    color: COLORS.primary,
    fontFamily: Font.bold,
  },
  descContainer: {
    paddingHorizontal: 20,
  },
  description: {
    textAlign: 'center',
    color: COLORS.textSec,
    lineHeight: 22,
    fontSize: 15,
  },

  // Members
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: METRICS.padding,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginRight: 10,
  },
  pillCount: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pillText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: Font.bold,
  },
  memberList: {
    paddingHorizontal: METRICS.padding,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    marginBottom: 12,
    borderRadius: 20,
    // Soft Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.inputBg,
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
  },
  memberUsername: {
    fontSize: 13,
    color: COLORS.textSec,
    fontFamily: Font.regular,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontFamily: Font.bold,
    textTransform: 'uppercase',
  },

  // Footer Actions
  footer: {
    padding: METRICS.padding,
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: METRICS.radius,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    // Glow effect
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Font.bold,
  },
  textButton: {
    alignItems: 'center',
    padding: 12,
  },
  textButtonLabel: {
    fontSize: 15,
    fontFamily: Font.semiBold,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboard: {
    width: '100%',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  modalCardDanger: {
    borderWidth: 2,
    borderColor: COLORS.dangerSoft,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },
  closeButton: {
    padding: 8,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
  },
  modalAvatarPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.inputBg,
    alignSelf: 'center',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  modalAvatarImage: {
    width: '100%',
    height: '100%',
  },
  modernInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textMain,
    marginBottom: 16,
  },
  modalHelperText: {
    fontSize: 14,
    color: COLORS.textSec,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalPrimaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalPrimaryBtnText: {
    color: '#FFF',
    fontFamily: Font.bold,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
    fontFamily: Font.semiBold,
  },
});