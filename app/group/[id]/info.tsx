import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal Imports
import { CustomToast } from '@/components/CustomToast';
import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DebtGroup, StaticDB } from '@/data/staticDatabase';

// =====================================================================
// DESIGN TOKENS (MATCHING PREVIOUS THEME)
// =====================================================================
const THEME = {
  colors: {
    bg: '#F9FAFB',        // Slate 50
    surface: '#FFFFFF',
    textMain: '#1F2937',  // Slate 900
    textSec: '#6B7280',   // Slate 500
    textTer: '#9CA3AF',
    primary: '#2563EB',   // Indigo 600
    danger: '#DC2626',
    border: '#E5E7EB',
    iconBg: '#F3F4F6',
    overlay: 'rgba(0,0,0,0.5)',
  },
  radius: { card: 16, button: 12, input: 12, modal: 20 },
  spacing: 20,
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================
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
      
      // Get Creator Info
      const creatorData = StaticDB.getUserById(groupData.creatorId);
      if (creatorData) setCreator(creatorData);

      // Get Members Info
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
      // Navigate back to Home (pop 2 screens: Info -> Detail -> Home)
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
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  const isCreator = user?.id === group.creatorId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.bg} />
      
      {/* HEADER: Back Button & Edit Dots (if Admin) */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={28} color={THEME.colors.primary} />
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
            <Ionicons name="ellipsis-vertical" size={24} color={THEME.colors.textMain} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. HERO SECTION (Centered) */}
        <View style={styles.heroSection}>
          <View style={styles.bigAvatar}>
            {group.groupImage ? (
              <Image source={{ uri: group.groupImage }} style={styles.bigAvatarImage} />
            ) : (
              <Text style={{ fontSize: 40 }}></Text>
            )}
          </View>
          
          <Text style={styles.groupName}>{group.name}</Text>
          
          <Text style={styles.metaText}>
            Created by <Text style={{ fontFamily: Font.bold }}>@{creator?.username || 'unknown'}</Text>
            {/* Mock Date format since DB might not have it, or use existing if available */}
            {group.createdAt ? `, ${new Date(group.createdAt).toLocaleDateString()}` : ''}
          </Text>

          <Text style={styles.description}>
            {group.description || 'No description available for this group.'}
          </Text>
        </View>

        {/* 2. MEMBER LIST SECTION */}
        <View style={styles.membersSection}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <Image 
                source={{ uri: member.profileImage || 'https://via.placeholder.com/50' }} 
                style={styles.memberAvatar} 
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.name} {member.id === user?.id && <Text style={{color: THEME.colors.textSec}}>(You)</Text>}
                </Text>
                <Text style={styles.memberUsername}>@{member.username}</Text>
              </View>
              {group.creatorId === member.id && (
                 <View style={styles.adminBadge}>
                    <Text style={styles.adminText}>Admin</Text>
                 </View>
              )}
            </View>
          ))}
        </View>

        {/* 3. FOOTER ACTIONS */}
        <View style={styles.footerActions}>
          {isCreator && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                setNewMemberUsername('');
                setFormError('');
                setShowAddMemberModal(true);
              }}
            >
              <Ionicons name="person-add-outline" size={22} color={THEME.colors.primary} />
              <Text style={styles.actionButtonText}>Invite to Group</Text>
            </TouchableOpacity>
          )}

          {isCreator ? (
            <TouchableOpacity 
              style={[styles.actionButton, { marginTop: 12 }]} 
              onPress={() => {
                setDeleteConfirmText('');
                setFormError('');
                setShowDeleteModal(true);
              }}
            >
              <Ionicons name="trash-outline" size={22} color={THEME.colors.danger} />
              <Text style={[styles.actionButtonText, { color: THEME.colors.danger }]}>Delete group</Text>
            </TouchableOpacity>
          ) : (
             <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]}>
                <Ionicons name="exit-outline" size={22} color={THEME.colors.danger} />
                <Text style={[styles.actionButtonText, { color: THEME.colors.danger }]}>Leave group</Text>
             </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* --- MODALS --- */}

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Group Info</Text>
            
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickGroupImage}>
               {editGroupImage ? (
                 <Image source={{ uri: editGroupImage }} style={styles.pickerImage} />
               ) : (
                 <Ionicons name="camera" size={32} color={THEME.colors.textSec} />
               )}
            </TouchableOpacity>

            <TextInput 
              style={styles.input} 
              value={editGroupName} 
              onChangeText={setEditGroupName} 
              placeholder="Group Name" 
            />
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              value={editGroupDescription} 
              onChangeText={setEditGroupDescription} 
              placeholder="Description" 
              multiline 
            />
            
            <View style={styles.modalButtons}>
               <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowEditModal(false)}>
                 <Text style={styles.modalBtnTextCancel}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSaveEdit}>
                 <Text style={styles.modalBtnTextPrimary}>Save</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* INVITE MODAL */}
      <Modal visible={showAddMemberModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite Member</Text>
            <Text style={styles.modalSub}>Enter the exact username to invite.</Text>
            
            <TextInput 
              style={styles.input} 
              value={newMemberUsername} 
              onChangeText={(t) => { setNewMemberUsername(t); setFormError(''); }} 
              placeholder="Username (e.g. johndoe)" 
              autoCapitalize="none"
            />
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            
            <View style={styles.modalButtons}>
               <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowAddMemberModal(false)}>
                 <Text style={styles.modalBtnTextCancel}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleInviteMember}>
                 <Text style={styles.modalBtnTextPrimary}>Invite</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE MODAL */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderColor: THEME.colors.danger, borderWidth: 1 }]}>
            <Text style={[styles.modalTitle, { color: THEME.colors.danger }]}>Delete Group</Text>
            <Text style={styles.modalSub}>
              This action cannot be undone. Type <Text style={{fontFamily: Font.bold}}>{group.name}</Text> to confirm.
            </Text>
            
            <TextInput 
              style={styles.input} 
              value={deleteConfirmText} 
              onChangeText={(t) => { setDeleteConfirmText(t); setFormError(''); }} 
              placeholder="Type group name here" 
            />
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            
            <View style={styles.modalButtons}>
               <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowDeleteModal(false)}>
                 <Text style={styles.modalBtnTextCancel}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                style={[styles.modalBtnPrimary, { backgroundColor: THEME.colors.danger }]} 
                onPress={handleDeleteGroup}
               >
                 <Text style={styles.modalBtnTextPrimary}>Delete</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomToast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast({ ...toast, visible: false })} 
      />
    </View>
  );
}

// =====================================================================
// STYLES
// =====================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: THEME.colors.bg, // Matches BG so it looks seamless
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface, // Subtle bg for buttons
  },

  scrollContent: {
    paddingBottom: 50,
  },

  // HERO SECTION
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 40,
  },
  bigAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50, // Circle
    backgroundColor: THEME.colors.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  bigAvatarImage: {
    width: '100%',
    height: '100%',
  },
  groupName: {
    fontSize: 24,
    fontFamily: Font.bold,
    color: THEME.colors.textMain,
    textAlign: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: THEME.colors.textSec,
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    fontFamily: Font.regular,
    color: THEME.colors.textMain,
    textAlign: 'center',
    lineHeight: 22,
  },

  // MEMBER LIST
  membersSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)', // Very subtle divider
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.border,
    marginRight: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: THEME.colors.textMain,
  },
  memberUsername: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: THEME.colors.textSec,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  adminText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontFamily: Font.bold,
  },

  // FOOTER ACTIONS
  footerActions: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: THEME.colors.primary,
    marginLeft: 8,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.modal,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: THEME.colors.textMain,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    color: THEME.colors.textSec,
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePicker: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.iconBg,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  pickerImage: {
    width: '100%',
    height: '100%',
  },
  input: {
    backgroundColor: THEME.colors.bg,
    borderRadius: THEME.radius.input,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 12,
    fontFamily: Font.regular,
    fontSize: 15,
  },
  errorText: {
    color: THEME.colors.danger,
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.radius.button,
    backgroundColor: THEME.colors.bg,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.radius.button,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
  },
  modalBtnTextCancel: {
    color: THEME.colors.textMain,
    fontFamily: Font.semiBold,
  },
  modalBtnTextPrimary: {
    color: '#FFF',
    fontFamily: Font.semiBold,
  },
});