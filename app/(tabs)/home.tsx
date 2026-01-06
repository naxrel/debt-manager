import LogOutIcon from '@/components/logout-icon';
import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Debt, StaticDB } from '@/data/staticDatabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ScrollView
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// --- DESIGN TOKENS ---
const COLORS = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTertiary: '#94A3B8',
  success: '#10B981',    // Emerald 500
  danger: '#EF4444',     // Red 500
  border: '#E2E8F0',
  inputBg: '#F1F5F9',
};

const SPACING = 20;

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { debts, isLoading: debtLoading, refreshDebts } = useDebt();
  const { isDarkMode } = useAppTheme(); // Theme logic retained but styling overridden for consistency
  
  const [activeTab, setActiveTab] = useState<'receive' | 'toPay'>('receive');
  const [pendingCount, setPendingCount] = useState(0);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('unpaid');

  // --- EFFECT & LOGIC PRESERVED ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      refreshDebts();
      calculatePendingCount();
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        refreshDebts();
        calculatePendingCount();
      }
    }, [user])
  );

  const calculatePendingCount = () => {
    if (!user) return;
    const pending = StaticDB.getPendingDebtsForUser(user.id);
    setPendingCount(pending.length);
  };

  // --- CALCULATION LOGIC PRESERVED ---
  if (!user) return null;

  const personalDebts = debts.filter(d => !d.isPaid && !d.groupId);
  const personalReceive = personalDebts.filter(d => d.type === 'piutang' && d.status === 'confirmed').reduce((sum, d) => sum + d.amount, 0);
  const personalPay = personalDebts.filter(d => d.type === 'hutang' && d.status === 'confirmed').reduce((sum, d) => sum + d.amount, 0);
  const personalBalance = personalReceive - personalPay;
  
  const allGroupTransactions = StaticDB.getAllGroupTransactions();
  const groupReceiveTransactions = allGroupTransactions.filter(gt => gt.toUserId === user.id);
  const groupPayTransactions = allGroupTransactions.filter(gt => !gt.isPaid && gt.fromUserId === user.id);
  const groupReceive = groupReceiveTransactions.reduce((sum, gt) => sum + gt.amount, 0);
  const groupPay = groupPayTransactions.reduce((sum, gt) => sum + gt.amount, 0);
  const groupBalance = groupReceive - groupPay;
  
  const balance = personalBalance + groupBalance;
  
  let filteredDebts = debts.filter(d => {
    if (activeTab === 'receive' && d.type !== 'piutang') return false;
    if (activeTab === 'toPay' && d.type !== 'hutang') return false;
    
    if (filterStatus === 'unpaid' && d.isPaid) return false;
    if (filterStatus === 'paid' && !d.isPaid) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = d.name.toLowerCase().includes(query);
      const matchAmount = d.amount.toString().includes(query);
      const matchDescription = d.description?.toLowerCase().includes(query);
      if (!matchName && !matchAmount && !matchDescription) return false;
    }
    
    return d.status === 'confirmed' || d.status === 'settlement_requested';
  });
  
  const displayDebts = filteredDebts;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (authLoading || debtLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- RENDER ITEM ---
  const renderDebtItem = ({ item }: { item: Debt }) => {
    const isReceive = item.type === 'piutang';
    return (
      <TouchableOpacity
        style={styles.debtCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/debt/detail?id=${item.id}`)}
      >
        <View style={styles.debtRow}>
          <View style={[styles.debtAvatar, { backgroundColor: isReceive ? COLORS.success + '20' : COLORS.danger + '20' }]}>
            <Text style={[styles.debtAvatarText, { color: isReceive ? COLORS.success : COLORS.danger }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.debtInfo}>
            <Text style={styles.debtName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.debtDate}>{formatDate(item.date)} • {item.description || 'No notes'}</Text>
          </View>
          
          <View style={{alignItems: 'flex-end'}}>
            <Text
              style={[
                styles.debtAmount,
                isReceive ? styles.positiveAmount : styles.negativeAmount,
              ]}
            >
              {isReceive ? '+' : '-'} {formatCurrency(item.amount)}
            </Text>
            {item.isPaid && (
               <View style={styles.paidBadge}>
                 <Text style={styles.paidBadgeText}>PAID</Text>
               </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.iconButton}
          >
            <LogOutIcon size={24} color={COLORS.textMain} />
          </TouchableOpacity>
      </View>

      {/* BALANCE HERO CARD */}
      <TouchableOpacity 
        style={styles.balanceCard}
        onPress={() => setShowBalanceModal(true)}
        activeOpacity={0.9}
      >
        <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
            {formatCurrency(balance)}
            </Text>
            <View style={styles.balanceDetailRow}>
                <Text style={styles.balanceDetailText}>
                    Personal: {formatCurrency(personalBalance)}
                </Text>
                <View style={styles.balanceDot} />
                <Text style={styles.balanceDetailText}>
                    Group: {formatCurrency(groupBalance)}
                </Text>
            </View>
        </View>
        <View style={styles.balanceArrow}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-6-6-6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
        </View>
      </TouchableOpacity>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        
        {/* Quick Action & Tabs Row */}
        <View style={styles.controlRow}>
            {/* Tabs Segment Control */}
            <View style={styles.segmentContainer}>
                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === 'receive' && styles.segmentBtnActive]}
                    onPress={() => setActiveTab('receive')}
                >
                    <Text style={[styles.segmentText, activeTab === 'receive' && styles.segmentTextActive]}>Receive</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === 'toPay' && styles.segmentBtnActive]}
                    onPress={() => setActiveTab('toPay')}
                >
                    <Text style={[styles.segmentText, activeTab === 'toPay' && styles.segmentTextActive]}>To Pay</Text>
                </TouchableOpacity>
            </View>

            {/* Floating Style Add Button */}
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => router.push('/debt/add')}
            >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 5v14M5 12h14" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
            </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingHorizontal: SPACING}}>
                {['unpaid', 'paid', 'all'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.filterChip, 
                            filterStatus === status && styles.filterChipActive,
                            filterStatus === status && { backgroundColor: activeTab === 'receive' ? COLORS.success : COLORS.danger }
                        ]}
                        onPress={() => setFilterStatus(status as any)}
                    >
                        <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
            <View style={styles.searchBar}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Circle cx="11" cy="11" r="8" stroke={COLORS.textTertiary} strokeWidth="2" />
                    <Path d="M21 21L16.65 16.65" stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round" />
                </Svg>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search transaction..."
                    placeholderTextColor={COLORS.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={{color: COLORS.textTertiary, fontSize: 16}}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>

        {/* PENDING NOTIFICATION */}
        {activeTab === 'receive' && pendingCount > 0 && (
            <TouchableOpacity
                style={styles.pendingBanner}
                onPress={() => router.push('/debt/pending')}
            >
                <View style={styles.pendingIcon}>
                    <Text>🔔</Text>
                </View>
                <View>
                    <Text style={styles.pendingTitle}>{pendingCount} Pending Request</Text>
                    <Text style={styles.pendingSub}>Tap to review settlement</Text>
                </View>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{marginLeft: 'auto'}}>
                    <Path d="M9 18l6-6-6-6" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
            </TouchableOpacity>
        )}

        {/* LIST */}
        <FlatList
            data={displayDebts}
            renderItem={renderDebtItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>
                        {activeTab === 'receive' ? 'All Clear!' : 'Debt Free!'}
                    </Text>
                    <Text style={styles.emptySub}>
                        {activeTab === 'receive' ? 'No one owes you money.' : 'You have no debts to pay.'}
                    </Text>
                </View>
            }
        />
      </View>

      {/* --- BALANCE MODAL (Refined) --- */}
      <Modal
        visible={showBalanceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBalanceModal(false)}
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowBalanceModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wallet Breakdown</Text>
              <TouchableOpacity onPress={() => setShowBalanceModal(false)} style={styles.modalCloseBtn}>
                <Text style={{fontSize: 16, fontWeight: 'bold', color: COLORS.textSec}}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
                <View style={styles.totalBlock}>
                    <Text style={styles.totalLabel}>Total Net Worth</Text>
                    <Text style={[
                        styles.totalValue,
                        balance >= 0 ? {color: COLORS.success} : {color: COLORS.danger}
                    ]}>
                        {formatCurrency(balance)}
                    </Text>
                </View>

                <View style={styles.breakdownRow}>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Personal</Text>
                        <Text style={styles.breakdownValue}>{formatCurrency(personalBalance)}</Text>
                    </View>
                    <View style={styles.breakdownDivider} />
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Groups</Text>
                        <Text style={styles.breakdownValue}>{formatCurrency(groupBalance)}</Text>
                    </View>
                </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
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
  },
  greeting: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },
  userName: {
    fontSize: 22,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: SPACING,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Font.regular,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    color: '#FFF',
    fontFamily: Font.bold,
    marginBottom: 8,
  },
  balanceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceDetailText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Font.regular,
  },
  balanceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },
  balanceArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content Area
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  
  // Controls (Tab + Add Btn)
  controlRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E2E8F0', // Slightly darker slate
    borderRadius: 40,
    padding: 6,
    height: 50,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },
  segmentTextActive: {
    color: COLORS.textMain,
    fontFamily: Font.bold,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 30 ,
    backgroundColor: COLORS.textMain,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Filters
  filterRow: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    borderColor: 'transparent',
    // Background handled inline for dynamic color
  },
  filterText: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },
  filterTextActive: {
    color: '#FFF',
    fontFamily: Font.bold,
  },

  // Search
  searchWrapper: {
    paddingHorizontal: SPACING,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textMain,
  },

  // Pending Banner
  pendingBanner: {
    marginHorizontal: SPACING,
    marginBottom: 16,
    backgroundColor: COLORS.primarySoft,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30', // 30% opacity
  },
  pendingIcon: {
    marginRight: 12,
  },
  pendingTitle: {
    fontSize: 14,
    fontFamily: Font.bold,
    color: COLORS.primary,
  },
  pendingSub: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },

  // List
  listContainer: {
    paddingHorizontal: SPACING,
    paddingBottom: 100,
  },
  debtCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // Soft shadow
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 1)',
  },
  debtRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16, // Squircle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  debtAvatarText: {
    fontSize: 18,
    fontFamily: Font.bold,
  },
  debtInfo: {
    flex: 1,
    marginRight: 8,
  },
  debtName: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 4,
  },
  debtDate: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: COLORS.textTertiary,
  },
  debtAmount: {
    fontSize: 16,
    fontFamily: Font.bold,
  },
  positiveAmount: {
    color: COLORS.success,
  },
  negativeAmount: {
    color: COLORS.danger,
  },
  paidBadge: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  paidBadgeText: {
    fontSize: 10,
    fontFamily: Font.bold,
    color: COLORS.textTertiary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textTertiary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSec,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)', // Slate 900 dim
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    // Add any specific styling for modal body if needed
  },
  totalBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textSec,
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontFamily: Font.bold,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 16,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 4,
    fontFamily: Font.bold,
    textTransform: 'uppercase',
  },
  breakdownValue: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
  },
});