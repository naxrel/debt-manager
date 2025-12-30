import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal Imports
import { BottomLeftArrow, RightArrow, TopRightArrow } from '@/components/ArrowIcons';
import { CustomToast } from '@/components/CustomToast';
import MemberCard from '@/components/group/MemberCard'; // Pastikan ini mengarah ke file MemberCard yang baru (Bottom Sheet)
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
export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // ─────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────
  const [group, setGroup] = useState<DebtGroup | null>(null);
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [optimizedDebts, setOptimizedDebts] = useState<OptimizedDebt[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'success' as 'success' | 'error' 
  });

  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<OptimizedDebt | null>(null);
  const [paymentDescription, setPaymentDescription] = useState('');
  
  // Member Sheet State
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberSheet, setShowMemberSheet] = useState(false);

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

    const groupTransactions = StaticDB.getGroupTransactions(id);
    const sortedTransactions = groupTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setTransactions(sortedTransactions);

    const members = groupData.memberIds
      .map(mId => StaticDB.getUserById(mId))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);

    const balanceMap = new Map<string, number>();
    groupData.memberIds.forEach(mId => balanceMap.set(mId, 0));

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
  const myOptimizedDebts = useMemo(() => {
    if (!user || !optimizedDebts.length) return { shouldPay: [], willReceive: [] };
    return DebtOptimizer.getUserSuggestions(user.id, optimizedDebts);
  }, [user, optimizedDebts]);

  const isDebtSettled = useCallback((fromUserId: string, toUserId: string, amount: number) => {
    return transactions.some(t => {
      return t.fromUserId === fromUserId && 
             t.toUserId === toUserId && 
             Math.abs(t.amount - amount) < 1000 &&
             t.isPaid &&
             t.description?.toLowerCase().includes('settlement');
    });
  }, [transactions]);

  // ─────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────
  const handleAddTransaction = useCallback(() => {
    router.push(`/group/${id}/add-transaction`);
  }, [id]);

  const handleHeaderPress = useCallback(() => {
    if (id) {
        // Navigasi ke halaman Info Group (Full Page)
        router.push(`/group/${id}/info`); 
    }
  }, [id]);

  const handleMemberClick = useCallback((userId: string) => {
    const member = StaticDB.getUserById(userId);
    if (member) {
      setSelectedMember(member);
      setShowMemberSheet(true); // Buka Bottom Sheet
    }
  }, []);

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
      setTimeout(() => { loadGroupData(); }, 50);
      setToast({ visible: true, message: 'Payment approved! 🎉', type: 'success' });
    } else {
      setToast({ visible: true, message: result.error || 'Failed to approve', type: 'error' });
    }
  }, [user, loadGroupData]);

  const handleRejectSettlement = useCallback((requestId: string) => {
    if (!user) return;
    const result = StaticDB.rejectSettlementRequest(requestId, user.id, 'Rejected by user');
    if (result.success) {
      setTimeout(() => { loadGroupData(); }, 50);
      setToast({ visible: true, message: 'Request rejected', type: 'error' });
    }
  }, [user, loadGroupData]);


  // ─────────────────────────────────────────────────────────────────
  // RENDER HEADER
  // ─────────────────────────────────────────────────────────────────
  const renderHeader = useCallback(() => (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        {/* LEFT: Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={THEME.colors.primary} />
        </TouchableOpacity>

        {/* CENTER: Group Info - Clickable */}
        <TouchableOpacity 
          style={styles.headerProfileContainer} 
          activeOpacity={0.7}
          onPress={handleHeaderPress}
        >
          <View style={styles.headerAvatar}>
            {group?.groupImage ? (
              <Image source={{ uri: group.groupImage }} style={styles.headerAvatarImage} />
            ) : (
              <Text style={{ fontSize: 18 }}>👥</Text>
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerGroupName} numberOfLines={1}>{group?.name}</Text>
            <Text style={styles.headerGroupBio} numberOfLines={1}>
              {group?.description || 'No description'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* RIGHT: Empty Action Area (Clean Look) */}
        <View style={styles.headerActions} />
      </View>
    </View>
  ), [group, handleHeaderPress, insets.top]);

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
      
      {/* Header */}
      {renderHeader()}

      {/* Main Content */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
            const isOwes = user && item.fromUserId === user.id;
            const isReceives = user && item.toUserId === user.id;
            const targetUserId = isOwes ? item.toUserId : item.fromUserId;
            const targetUser = StaticDB.getUserById(targetUserId);
            const isThirdParty = !isOwes && !isReceives;
            const fromName = StaticDB.getUserById(item.fromUserId)?.name.split(' ')[0];
            const toName = StaticDB.getUserById(item.toUserId)?.name.split(' ')[0];
            const title = isThirdParty ? `${fromName} → ${toName}` : (targetUser?.name || 'Unknown');

            return (
              <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
                {/* Clickable Avatar to Open Member Sheet */}
                <TouchableOpacity 
                  style={styles.avatarContainer}
                  onPress={() => handleMemberClick(targetUserId)}
                >
                  <Image source={{ uri: targetUser?.profileImage || 'https://via.placeholder.com/100' }} style={styles.avatarImage} />
                  <View style={[styles.badgeIcon, { backgroundColor: isOwes ? THEME.colors.danger : isReceives ? THEME.colors.success : THEME.colors.textSec }]}>
                    {isOwes ? <TopRightArrow color="#FFF" size={10} /> : isReceives ? <BottomLeftArrow color="#FFF" size={10} /> : <RightArrow color="#FFF" size={10} />}
                  </View>
                </TouchableOpacity>

                <View style={styles.centerContent}>
                  <Text style={styles.itemTitle}>{title}</Text>
                  <Text style={styles.itemNote} numberOfLines={1}>{item.description}</Text>
                </View>
                <View style={styles.rightContent}>
                  <Text style={[styles.itemAmount, { color: isOwes ? THEME.colors.textMain : isReceives ? THEME.colors.success : THEME.colors.textMain }]}>
                    {isOwes ? '-' : isReceives ? '+' : ''} {formatCurrency(item.amount).replace('Rp', '').trim()}
                  </Text>
                  <Text style={styles.itemTime}>{formatTimeAgo(item.date)}</Text>
                </View>
              </TouchableOpacity>
            );
        }}
        ListHeaderComponent={(
            <View>
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Waiting Approval</Text>
                        {pendingRequests.map((request) => (
                            <View key={request.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{StaticDB.getUserById(request.fromUserId)?.name} pays</Text>
                                    <Text style={[styles.amountText, { color: THEME.colors.success }]}>{formatCurrency(request.amount)}</Text>
                                </View>
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={[styles.pillButton, { backgroundColor: THEME.colors.success, flex: 1 }]} onPress={() => handleApproveSettlement(request.id)}>
                                        <Text style={styles.pillButtonText}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.pillButton, { backgroundColor: THEME.colors.iconBg, flex: 1 }]} onPress={() => handleRejectSettlement(request.id)}>
                                        <Text style={[styles.pillButtonText, { color: THEME.colors.textSec }]}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                {/* Owe Debts */}
                {myOptimizedDebts.shouldPay.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>You Owe</Text>
                        {myOptimizedDebts.shouldPay.filter(d => !isDebtSettled(d.from, d.to, d.amount)).map((debt, index) => (
                            <View key={index} style={styles.card}>
                                <View style={styles.rowBetween}>
                                    <View>
                                        <Text style={styles.cardSubtitle}>To: {debt.toName}</Text>
                                        <Text style={[styles.amountText, { fontSize: 20 }]}>{formatCurrency(debt.amount)}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.pillButtonPrimary} onPress={() => handlePayDebt(debt)}>
                                        <Text style={styles.pillButtonText}>Pay Now</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                {/* Receive Debts */}
                {myOptimizedDebts.willReceive.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>You Receive</Text>
                        {myOptimizedDebts.willReceive.filter(d => !isDebtSettled(d.from, d.to, d.amount)).map((debt, index) => (
                            <View key={index} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: THEME.colors.success }]}>
                                <View style={styles.rowBetween}>
                                    <View>
                                        <Text style={styles.cardSubtitle}>From: {debt.fromName}</Text>
                                        <Text style={[styles.amountText, { color: THEME.colors.success }]}>{formatCurrency(debt.amount)}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                <View style={[styles.section, { marginBottom: 10 }]}>
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                </View>
            </View>
        )}
        ListFooterComponent={(
          <TouchableOpacity style={styles.dashedButton} onPress={handleAddTransaction}>
            <Text style={{ fontSize: 18, marginRight: 8, color: THEME.colors.textSec }}>+</Text>
            <Text style={styles.dashedButtonText}>Add New Transaction</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODALS & SHEETS */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.textSmall}>Pay to: <Text style={{ fontFamily: Font.bold }}>{selectedDebt?.toName}</Text></Text>
              <Text style={[styles.amountText, { textAlign: 'center', marginVertical: 15, fontSize: 30 }]}>
                {selectedDebt && formatCurrency(selectedDebt.amount)}
              </Text>
            </View>
            <TextInput style={styles.input} placeholder="Note (e.g. Bank Transfer)" value={paymentDescription} onChangeText={setPaymentDescription} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.pillButton, { backgroundColor: THEME.colors.bg }]} onPress={() => setShowPaymentModal(false)}>
                <Text style={{ fontFamily: Font.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pillButtonPrimary, { flex: 1, marginLeft: 10 }]} onPress={confirmPayment}>
                <Text style={styles.pillButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Member Bottom Sheet (Updated) */}
      <MemberCard 
        visible={showMemberSheet} 
        onClose={() => setShowMemberSheet(false)} 
        member={selectedMember} 
      />

      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
}

// =====================================================================
// STYLES
// =====================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // HEADER STYLES
  headerContainer: {
    backgroundColor: THEME.colors.surface,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    zIndex: 10,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56, 
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerProfileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerGroupName: {
    fontSize: 17,
    fontFamily: Font.bold,
    color: THEME.colors.textMain,
    marginBottom: 2,
  },
  headerGroupBio: {
    fontSize: 13,
    color: THEME.colors.textTer,
    fontFamily: Font.regular,
  },
  headerActions: {
    width: 24, // Placeholder width to balance layout
  },

  // OTHER STYLES
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
});