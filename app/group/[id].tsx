// =====================================================================
// IMPORTS
// =====================================================================
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// Internal Imports
import { BottomLeftArrow, RightArrow, TopRightArrow } from '@/components/ArrowIcons';
import { CustomToast } from '@/components/CustomToast';
import MemberCard from '@/components/group/MemberCard';
import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DebtGroup, GroupTransaction, StaticDB } from '@/data/staticDatabase';
import { DebtOptimizer, OptimizedDebt } from '@/utils/debtOptimizer';

// =====================================================================
// CONSTANTS & DESIGN SYSTEM
// =====================================================================
const THEME = {
  colors: {
    bg: '#F9FAFB',
    surface: '#FFFFFF',
    textMain: '#1F2937',
    textSec: '#6B7280',
    textTer: '#9CA3AF',
    primary: '#2563EB',
    success: '#059669',
    successBg: '#D1FAE5',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
    warning: '#D97706',
    warningBg: '#FEF3C7',
    border: '#E5E7EB',
    iconBg: '#F3F4F6',
    overlay: 'rgba(0,0,0,0.5)',
  },
  radius: { card: 16, button: 50, input: 12, modal: 20 },
  spacing: 20,
} as const;

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) {
    return now.getDate() === date.getDate() 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Yesterday';
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount).replace('Rp', 'Rp ');
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

// =====================================================================
// MAIN COMPONENT
// =====================================================================
export default function GroupDetailScreen() {
  // ─────────────────────────────────────────────────────────────────
  // ROUTE PARAMS & CONTEXT
  // ─────────────────────────────────────────────────────────────────
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  // ─────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────
  // Core Data
  const [group, setGroup] = useState<DebtGroup | null>(null);
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [optimizedDebts, setOptimizedDebts] = useState<OptimizedDebt[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'success' as 'success' | 'error' 
  });

  // Modal & Drawer States
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupImage, setEditGroupImage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<OptimizedDebt | null>(null);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberCard, setShowMemberCard] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────────
  const loadGroupData = useCallback(() => {
    if (!id || !user) return;

    const groupData = StaticDB.getGroupById(id);
    if (!groupData) {
      Alert.alert('Error', 'Group not found', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    setGroup(groupData);
    setPendingRequests(StaticDB.getPendingSettlementRequests(user.id, id));

    // Load & sort transactions (newest first)
    const groupTransactions = StaticDB.getGroupTransactions(id);
    const sortedTransactions = groupTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setTransactions(sortedTransactions);

    // Calculate balance map (manual calculation for accuracy)
    const members = groupData.memberIds
      .map(mId => StaticDB.getUserById(mId))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);

    const balanceMap = new Map<string, number>();
    groupData.memberIds.forEach(mId => balanceMap.set(mId, 0));

    // Only unpaid transactions affect balance
    groupTransactions
      .filter(t => !t.isPaid)
      .forEach(t => {
        balanceMap.set(t.fromUserId, (balanceMap.get(t.fromUserId) || 0) - t.amount);
        balanceMap.set(t.toUserId, (balanceMap.get(t.toUserId) || 0) + t.amount);
      });

    const userBalances = members.map(m => ({
      userId: m.id,
      userName: m.name,
      balance: balanceMap.get(m.id) || 0,
    }));

    setOptimizedDebts(DebtOptimizer.optimizeDebts(userBalances));
    setIsLoading(false);
    setIsRefreshing(false);
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [loadGroupData])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadGroupData();
  }, [loadGroupData]);

  // ─────────────────────────────────────────────────────────────────
  // MEMOIZED COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────
  // MEMOIZED COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────
  const myOptimizedDebts = useMemo(() => {
    if (!user || !optimizedDebts.length) return { shouldPay: [], willReceive: [] };
    return DebtOptimizer.getUserSuggestions(user.id, optimizedDebts);
  }, [user, optimizedDebts]);

  // Check if a debt has been settled (has recent settlement transaction)
  const isDebtSettled = useCallback((fromUserId: string, toUserId: string, amount: number) => {
    // Check if there's a settlement transaction that matches this debt
    return transactions.some(t => {
      return t.fromUserId === fromUserId && 
             t.toUserId === toUserId && 
             Math.abs(t.amount - amount) < 1000 &&
             t.isPaid &&
             t.description?.toLowerCase().includes('settlement');
    });
  }, [transactions]);

  // Filter out settled debts from optimized debts
  const unsettledDebts = useMemo(() => {
    return optimizedDebts.filter(debt => 
      !isDebtSettled(debt.from, debt.to, debt.amount)
    );
  }, [optimizedDebts, isDebtSettled]);

  // ─────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────
  const handleAddTransaction = useCallback(() => {
    router.push(`/group/${id}/add-transaction`);
  }, [id]);

  const openMembersDrawer = useCallback(() => {
    setShowMembersDrawer(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [slideAnim]);

  const closeMembersDrawer = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true
    }).start(() => setShowMembersDrawer(false));
  }, [slideAnim]);

  const handlePayDebt = useCallback((debt: OptimizedDebt) => {
    setSelectedDebt(debt);
    setShowPaymentModal(true);
  }, []);

  const confirmPayment = useCallback(() => {
    if (!selectedDebt || !group || !user) return;

    const description = paymentDescription.trim() || 
      `Settlement: ${selectedDebt.fromName} → ${selectedDebt.toName}`;
    
    const result = StaticDB.createSettlementRequest(
      group.id,
      selectedDebt.from,
      selectedDebt.to,
      selectedDebt.amount,
      description
    );

    setShowPaymentModal(false);
    setSelectedDebt(null);
    setPaymentDescription('');
    loadGroupData();

    setToast({
      visible: true,
      message: result.success 
        ? 'Request sent! Waiting approval ⏳' 
        : result.error || 'Failed to send request',
      type: result.success ? 'success' : 'error'
    });
  }, [selectedDebt, group, user, paymentDescription, loadGroupData]);

  const handleApproveSettlement = useCallback((requestId: string) => {
    if (!user) return;
    
    const result = StaticDB.approveSettlementRequest(requestId, user.id);
    
    if (result.success) {
      // Force immediate refresh with slight delay to ensure DB is updated
      setTimeout(() => {
        loadGroupData();
      }, 50);
      
      setToast({
        visible: true,
        message: 'Payment approved! 🎉',
        type: 'success'
      });
    } else {
      setToast({
        visible: true,
        message: result.error || 'Failed to approve',
        type: 'error'
      });
    }
  }, [user, loadGroupData]);

  const handleRejectSettlement = useCallback((requestId: string) => {
    if (!user) return;
    
    const result = StaticDB.rejectSettlementRequest(requestId, user.id, 'Rejected by user');
    
    if (result.success) {
      setTimeout(() => {
        loadGroupData();
      }, 50);
      
      setToast({
        visible: true,
        message: 'Request rejected',
        type: 'error'
      });
    }
  }, [user, loadGroupData]);

  const handleDeleteGroup = useCallback(() => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!group) return;

    if (deleteConfirmText.trim() === group.name) {
      setShowDeleteModal(false);
      const result = StaticDB.deleteGroup(group.id);
      
      if (result.success) {
        Alert.alert('Success', 'Group deleted', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to delete group');
      }
    } else {
      Alert.alert('Error', 'Group name does not match');
    }
  }, [group, deleteConfirmText]);

  const handleAddMember = useCallback(() => {
    if (!group || !newMemberUsername.trim()) {
      setAddMemberError('Enter username');
      return;
    }

    const foundUser = StaticDB.getUserByUsername(newMemberUsername.trim());
    
    if (!foundUser) {
      setAddMemberError('Username not found');
      return;
    }

    if (group.memberIds.includes(foundUser.id)) {
      setAddMemberError('User already in group');
      return;
    }

    const result = StaticDB.addMemberToGroup(group.id, foundUser.id);
    
    if (result.success) {
      setShowAddMemberModal(false);
      setNewMemberUsername('');
      setAddMemberError('');
      loadGroupData();
      Alert.alert('Success', `${foundUser.name} added to group`);
    } else {
      setAddMemberError(result.error || 'Failed to add member');
    }
  }, [group, newMemberUsername, loadGroupData]);

  const handleSaveGroupEdit = useCallback(() => {
    if (!group || !editGroupName.trim()) return;

    const result = StaticDB.updateGroup(group.id, {
      name: editGroupName.trim(),
      description: editGroupDescription.trim(),
      groupImage: editGroupImage || undefined
    });

    if (result.success) {
      setShowEditModal(false);
      loadGroupData();
      Alert.alert('Success', 'Group updated');
    }
  }, [group, editGroupName, editGroupDescription, editGroupImage, loadGroupData]);

  const handlePickGroupImage = useCallback(async () => {
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
  }, []);

  const handleMemberClick = useCallback((memberId: string) => {
    const member = StaticDB.getUserById(memberId);
    if (member) {
      setSelectedMember(member);
      closeMembersDrawer();
      setTimeout(() => setShowMemberCard(true), 300);
    }
  }, [closeMembersDrawer]);

  // ─────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────
  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={THEME.colors.textMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{group?.name}</Text>
        </View>

        <View style={styles.headerActions}>
          {user && group?.creatorId === user.id && (
            <TouchableOpacity
              onPress={() => {
                setEditGroupName(group?.name || '');
                setEditGroupDescription(group?.description || '');
                setEditGroupImage(group?.groupImage || null);
                setShowEditModal(true);
              }}
              style={styles.iconButton}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={THEME.colors.textMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="3" />
                <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </Svg>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openMembersDrawer} style={styles.iconButton}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={THEME.colors.textMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <Circle cx="9" cy="7" r="4" />
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.groupInfoContainer}>
        <View style={styles.groupImageWrapper}>
          {group?.groupImage ? (
            <Image source={{ uri: group.groupImage }} style={styles.groupImage} />
          ) : (
            <Text style={{ fontSize: 32 }}>👥</Text>
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.groupDesc} numberOfLines={2}>
            {group?.description || 'No description yet.'}
          </Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillText}>{group?.memberIds.length} Members</Text>
          </View>
        </View>
      </View>
    </View>
  ), [group, user, openMembersDrawer]);

  const renderDashboard = useCallback(() => (
    <View>
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waiting Approval</Text>
          {pendingRequests.map((request) => (
            <View key={request.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {StaticDB.getUserById(request.fromUserId)?.name} wants to pay
                </Text>
                <Text style={[styles.amountText, { color: THEME.colors.success }]}>
                  {formatCurrency(request.amount)}
                </Text>
              </View>
              <Text style={styles.cardSubtitle}>{request.description}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.pillButton, { backgroundColor: THEME.colors.success, flex: 1 }]}
                  onPress={() => handleApproveSettlement(request.id)}
                >
                  <Text style={styles.pillButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillButton, { backgroundColor: THEME.colors.iconBg, flex: 1 }]}
                  onPress={() => handleRejectSettlement(request.id)}
                >
                  <Text style={[styles.pillButtonText, { color: THEME.colors.textSec }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* My Actions Section */}
      {(myOptimizedDebts.shouldPay.length > 0 || myOptimizedDebts.willReceive.length > 0) && (
        <View style={styles.section}>
          {(() => {
            // Filter active debts to pay (not settled, not pending approval)
            const activeDebtsToPayments = myOptimizedDebts.shouldPay.filter(debt => {
              if (isDebtSettled(debt.from, debt.to, debt.amount)) return false;
              
              const hasPendingRequest = pendingRequests.some(
                req => req.fromUserId === debt.from &&
                       req.toUserId === debt.to && 
                       Math.abs(req.amount - debt.amount) < 1000
              );
              
              return !hasPendingRequest;
            });

            return activeDebtsToPayments.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>You Owe</Text>
                {activeDebtsToPayments.map((debt, index) => (
                  <View key={`pay-${index}`} style={styles.card}>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.cardSubtitle}>To: {debt.toName}</Text>
                        <Text style={[styles.amountText, { fontSize: 20 }]}>
                          {formatCurrency(debt.amount)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.pillButtonPrimary}
                        onPress={() => handlePayDebt(debt)}
                      >
                        <Text style={styles.pillButtonText}>Pay Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            );
          })()}

          {(() => {
            // Filter out debts that:
            // 1. Have active pending requests (waiting approval)
            // 2. Have been recently settled
            const activeReceivableDebts = myOptimizedDebts.willReceive.filter(debt => {
              // Check if has pending request
              const hasPendingRequest = pendingRequests.some(
                req => req.fromUserId === debt.from && 
                       req.toUserId === debt.to &&
                       Math.abs(req.amount - debt.amount) < 1000
              );
              
              // Check if already settled
              const alreadySettled = isDebtSettled(debt.from, debt.to, debt.amount);
              
              return !hasPendingRequest && !alreadySettled;
            });
            
            return activeReceivableDebts.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>You Receive</Text>
                {activeReceivableDebts.map((debt, index) => (
                  <View
                    key={`receive-${index}`}
                    style={[styles.card, { borderLeftWidth: 4, borderLeftColor: THEME.colors.success }]}
                  >
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.cardSubtitle}>From: {debt.fromName}</Text>
                        <Text style={[styles.amountText, { color: THEME.colors.success }]}>
                          {formatCurrency(debt.amount)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            );
          })()}
        </View>
      )}

      {/* All Settlements Summary */}
      {unsettledDebts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Settlements</Text>
          <View style={styles.card}>
            {unsettledDebts.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.rowBetween,
                  {
                    marginBottom: 8,
                    paddingBottom: 8,
                    borderBottomWidth: i === unsettledDebts.length - 1 ? 0 : 1,
                    borderBottomColor: THEME.colors.border
                  }
                ]}
              >
                <Text style={[styles.textSmall, { fontFamily: Font.regular }]}>
                  {d.fromName} → {d.toName}
                </Text>
                <Text style={[styles.textSmall, { fontFamily: Font.bold, color: THEME.colors.primary }]}>
                  {formatCurrency(d.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Transaction History Header */}
      <View style={[styles.section, { marginBottom: 10 }]}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
      </View>
    </View>
  ), [pendingRequests, myOptimizedDebts, unsettledDebts, handleApproveSettlement, handleRejectSettlement, handlePayDebt]);

  const renderTransactionItem = useCallback(({ item }: { item: GroupTransaction }) => {
    const isOwes = user && item.fromUserId === user.id;
    const isReceives = user && item.toUserId === user.id;

    // Determine target user to show correct avatar
    const targetUserId = isOwes ? item.toUserId : item.fromUserId;
    const targetUser = StaticDB.getUserById(targetUserId);
    const displayTitle = targetUser?.name || 'Unknown';

    // Third party transaction logic (A pays B, viewed by C)
    const isThirdParty = !isOwes && !isReceives;
    const fromName = StaticDB.getUserById(item.fromUserId)?.name.split(' ')[0];
    const toName = StaticDB.getUserById(item.toUserId)?.name.split(' ')[0];
    const thirdPartyTitle = `${fromName} → ${toName}`;

    return (
      <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
        {/* LEFT: Avatar & Badge */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: targetUser?.profileImage || 'https://via.placeholder.com/100' }}
            style={styles.avatarImage}
          />
          <View
            style={[
              styles.badgeIcon,
              {
                backgroundColor: isOwes
                  ? THEME.colors.danger
                  : isReceives
                  ? THEME.colors.success
                  : THEME.colors.textSec
              }
            ]}
          >
            {isOwes ? (
              <TopRightArrow color="#FFF" size={10} />
            ) : isReceives ? (
              <BottomLeftArrow color="#FFF" size={10} />
            ) : (
              <RightArrow color="#FFF" size={10} />
            )}
          </View>
        </View>

        {/* CENTER: Name & Note */}
        <View style={styles.centerContent}>
          <Text style={styles.itemTitle}>
            {isThirdParty ? thirdPartyTitle : displayTitle}
          </Text>
          <Text style={styles.itemNote} numberOfLines={1}>
            {item.description || 'No description'}
          </Text>
        </View>

        {/* RIGHT: Amount & Time */}
        <View style={styles.rightContent}>
          <Text
            style={[
              styles.itemAmount,
              {
                color: isOwes
                  ? THEME.colors.textMain
                  : isReceives
                  ? THEME.colors.success
                  : THEME.colors.textMain
              }
            ]}
          >
            {isOwes ? '-' : isReceives ? '+' : ''}
            {formatCurrency(item.amount).replace('Rp', '').trim()}
          </Text>
          <Text style={styles.itemTime}>{formatTimeAgo(item.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [user]);

  // ─────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (!group || !user) {
    return (
      <View style={styles.loadingCenter}>
        <Text>Data not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.surface} />
      {renderHeader()}

      {/* Main List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        ListHeaderComponent={renderDashboard}
        ListFooterComponent={(
          <TouchableOpacity style={styles.dashedButton} onPress={handleAddTransaction}>
            <Text style={{ fontSize: 18, marginRight: 8, color: THEME.colors.textSec }}>+</Text>
            <Text style={styles.dashedButtonText}>Add New Transaction</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.textSmall}>
                Pay to: <Text style={{ fontFamily: Font.bold }}>{selectedDebt?.toName}</Text>
              </Text>
              <Text
                style={[
                  styles.amountText,
                  { textAlign: 'center', marginVertical: 15, fontSize: 30 }
                ]}
              >
                {selectedDebt && formatCurrency(selectedDebt.amount)}
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Note (e.g. Bank Transfer)"
              value={paymentDescription}
              onChangeText={setPaymentDescription}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.pillButton, { backgroundColor: THEME.colors.bg }]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={{ fontFamily: Font.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillButtonPrimary, { flex: 1, marginLeft: 10 }]}
                onPress={confirmPayment}
              >
                <Text style={styles.pillButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Group</Text>

            <TouchableOpacity
              style={{ alignSelf: 'center', marginBottom: 20 }}
              onPress={handlePickGroupImage}
            >
              {editGroupImage ? (
                <Image
                  source={{ uri: editGroupImage }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: THEME.colors.iconBg,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ fontSize: 24 }}>📷</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={editGroupName}
              onChangeText={setEditGroupName}
              placeholder="Group Name"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={editGroupDescription}
              onChangeText={setEditGroupDescription}
              placeholder="Description"
              multiline
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.pillButton, { backgroundColor: THEME.colors.bg }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillButtonPrimary, { flex: 1, marginLeft: 10 }]}
                onPress={handleSaveGroupEdit}
              >
                <Text style={styles.pillButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{ marginTop: 20, alignSelf: 'center' }}
              onPress={handleDeleteGroup}
            >
              <Text style={{ color: THEME.colors.danger, fontFamily: Font.semiBold }}>
                Delete Group
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderColor: THEME.colors.danger, borderWidth: 1 }]}>
            <Text style={[styles.modalTitle, { color: THEME.colors.danger }]}>
              Delete Group?
            </Text>
            <Text style={{ marginBottom: 10, color: THEME.colors.textSec }}>
              Type "
              <Text style={{ fontWeight: 'bold', color: THEME.colors.textMain }}>
                {group?.name}
              </Text>
              " to confirm.
            </Text>
            <TextInput
              style={styles.input}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Group name..."
              autoCapitalize="none"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.pillButton, { backgroundColor: THEME.colors.bg }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pillButton,
                  {
                    backgroundColor:
                      deleteConfirmText === group?.name ? THEME.colors.danger : '#ccc',
                    flex: 1,
                    marginLeft: 10
                  }
                ]}
                disabled={deleteConfirmText !== group?.name}
                onPress={confirmDelete}
              >
                <Text style={styles.pillButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={showAddMemberModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite Member</Text>
            <TextInput
              style={styles.input}
              value={newMemberUsername}
              onChangeText={(t) => {
                setNewMemberUsername(t);
                setAddMemberError('');
              }}
              placeholder="Enter username..."
              autoCapitalize="none"
            />
            {addMemberError ? (
              <Text style={{ color: THEME.colors.danger, marginBottom: 10 }}>
                {addMemberError}
              </Text>
            ) : null}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.pillButton, { backgroundColor: THEME.colors.bg }]}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillButtonPrimary, { flex: 1, marginLeft: 10 }]}
                onPress={handleAddMember}
              >
                <Text style={styles.pillButtonText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Members Drawer */}
      <Modal
        visible={showMembersDrawer}
        transparent
        animationType="none"
        onRequestClose={closeMembersDrawer}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={closeMembersDrawer}
        >
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Members</Text>
              {user && group?.creatorId === user.id && (
                <TouchableOpacity
                  onPress={() => {
                    closeMembersDrawer();
                    setTimeout(() => setShowAddMemberModal(true), 300);
                  }}
                >
                  <Text style={{ color: THEME.colors.primary, fontFamily: Font.bold }}>
                    + Invite
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={group?.memberIds}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const m = StaticDB.getUserById(item);
                if (!m) return null;
                return (
                  <TouchableOpacity
                    style={styles.memberListItem}
                    onPress={() => handleMemberClick(item)}
                  >
                    <Image
                      source={{ uri: m.profileImage || 'https://via.placeholder.com/40' }}
                      style={styles.avatarSmall}
                    />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.listItemTitle}>
                        {m.name} {m.id === user?.id && '(You)'}
                      </Text>
                      <Text style={styles.listItemSubtitle}>@{m.username}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Member Detail Card */}
      {selectedMember && (
        <MemberCard
          visible={showMemberCard}
          onClose={() => setShowMemberCard(false)}
          member={selectedMember}
          headerPaddingTop={50}
        />
      )}

      {/* Toast Notification */}
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

// =====================================================================
// STYLES
// =====================================================================
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Header
  header: {
    backgroundColor: THEME.colors.surface,
    paddingTop: 50,
    paddingHorizontal: THEME.spacing,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Font.bold,
    color: THEME.colors.textMain
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10
  },
  iconButton: {
    padding: 8,
    backgroundColor: THEME.colors.bg,
    borderRadius: THEME.radius.button
  },
  groupInfoContainer: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center'
  },
  groupImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  groupImage: {
    width: '100%',
    height: '100%'
  },
  groupDesc: {
    color: THEME.colors.textSec,
    fontSize: 14,
    marginBottom: 5,
    fontFamily: Font.regular
  },
  pillBadge: {
    backgroundColor: THEME.colors.iconBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  pillText: {
    fontSize: 12,
    color: THEME.colors.textSec,
    fontFamily: Font.semiBold
  },

  // Sections
  section: {
    marginTop: 20,
    paddingHorizontal: THEME.spacing
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: THEME.colors.textMain,
    marginBottom: 12
  },

  // Cards
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.card,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Font.semiBold,
    color: THEME.colors.textMain
  },
  cardSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSec,
    fontFamily: Font.regular
  },
  amountText: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: THEME.colors.textMain
  },
  textSmall: {
    fontSize: 14,
    color: THEME.colors.textMain,
    fontFamily: Font.regular
  },

  // Transaction Item
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: THEME.spacing,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.border
  },
  badgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.surface
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center'
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: THEME.colors.textMain,
    marginBottom: 4
  },
  itemNote: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: THEME.colors.textSec
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  itemAmount: {
    fontSize: 16,
    fontFamily: Font.bold,
    marginBottom: 4
  },
  itemTime: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: THEME.colors.textSec
  },

  // Members
  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.iconBg
  },
  listItemTitle: {
    fontSize: 15,
    fontFamily: Font.semiBold,
    color: THEME.colors.textMain
  },
  listItemSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSec,
    fontFamily: Font.regular
  },

  // Buttons & Inputs
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15
  },
  pillButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.radius.button,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pillButtonPrimary: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.radius.button,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pillButtonText: {
    color: 'white',
    fontFamily: Font.semiBold,
    fontSize: 14
  },
  dashedButton: {
    margin: THEME.spacing,
    marginTop: 10,
    padding: 16,
    borderRadius: THEME.radius.card,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  dashedButtonText: {
    color: THEME.colors.textSec,
    fontFamily: Font.semiBold,
    fontSize: 15
  },
  input: {
    backgroundColor: THEME.colors.bg,
    borderRadius: THEME.radius.input,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 15,
    fontFamily: Font.regular,
    color: THEME.colors.textMain
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.modal,
    padding: 24,
    width: '100%'
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Font.bold,
    marginBottom: 15,
    textAlign: 'center',
    color: THEME.colors.textMain
  },

  // Drawers
  drawerOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'flex-end'
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    backgroundColor: THEME.colors.surface,
    padding: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 5
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  drawerTitle: {
    fontSize: 22,
    fontFamily: Font.bold,
    color: THEME.colors.textMain
  }
});