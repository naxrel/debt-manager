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
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { debts, isLoading: debtLoading, getStatistics, refreshDebts } = useDebt();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'receive' | 'toPay'>('receive');
  const [pendingCount, setPendingCount] = useState(0);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

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

  // Refresh debts when screen is focused
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

  if (authLoading || debtLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate personal balance (debts without groupId)
  const personalDebts = debts.filter(d => !d.isPaid && !d.groupId);
  const personalReceive = personalDebts.filter(d => d.type === 'piutang' && d.status === 'confirmed').reduce((sum, d) => sum + d.amount, 0);
  const personalPay = personalDebts.filter(d => d.type === 'hutang' && d.status === 'confirmed').reduce((sum, d) => sum + d.amount, 0);
  const personalBalance = personalReceive - personalPay;
  
  // Calculate group balance from group transactions (include isPaid for receive side)
  const allGroupTransactions = StaticDB.getAllGroupTransactions();
  const groupReceiveTransactions = allGroupTransactions.filter(gt => gt.toUserId === user.id);
  const groupPayTransactions = allGroupTransactions.filter(gt => !gt.isPaid && gt.fromUserId === user.id);
  const groupReceive = groupReceiveTransactions.reduce((sum, gt) => sum + gt.amount, 0);
  const groupPay = groupPayTransactions.reduce((sum, gt) => sum + gt.amount, 0);
  const groupBalance = groupReceive - groupPay;
  
  // Total balance (personal + group)
  const balance = personalBalance + groupBalance;
  
  // Filter debts by type for tabs
  const receiveDebts = debts.filter(d => !d.isPaid && d.type === 'piutang' && d.status === 'confirmed');
  const toPayDebts = debts.filter(d => !d.isPaid && d.type === 'hutang' && d.status === 'confirmed');
  
  // Get debts based on active tab
  const displayDebts = activeTab === 'receive' ? receiveDebts : toPayDebts;

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

  const renderDebtItem = ({ item }: { item: Debt }) => {
    return (
      <TouchableOpacity
        style={styles.debtCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/debt/detail?id=${item.id}`)}
      >
        <View style={styles.debtRow}>
          <View style={styles.debtAvatar}>
            <Text style={styles.debtAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.debtInfo}>
            <Text style={styles.debtName}>{item.name}</Text>
            <Text style={styles.debtDate}>{formatDate(item.date)}</Text>
          </View>
          <Text
            style={[
              styles.debtAmount,
              item.type === 'piutang' ? styles.positiveAmount : styles.negativeAmount,
            ]}
          >
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View>
          <Text style={[styles.greeting, isDarkMode && styles.textDark]}>Hello,</Text>
          <Text style={[styles.userName, isDarkMode && styles.textDark]}>{user.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Svg width={24} height={24} viewBox="0 0 23 21" fill="none">
            <Path d="M9.28062 6.46494V5.72152C9.28062 4.10317 9.28062 3.294 9.75458 2.73451C10.2285 2.17502 11.0267 2.04199 12.623 1.77594L14.2942 1.49741C17.5373 0.956891 19.1589 0.686633 20.2197 1.58533C21.2806 2.48403 21.2806 4.12794 21.2806 7.41577V13.2502C21.2806 16.5381 21.2806 18.182 20.2197 19.0807C19.1589 19.9794 17.5373 19.7091 14.2942 19.1686L12.623 18.8901C11.0267 18.624 10.2285 18.491 9.75458 17.9315C9.28062 17.372 9.28062 16.5628 9.28062 14.9445V14.399" stroke="#000" strokeWidth="2"/>
            <Path d="M1.28062 10.333L0.499756 9.70831L-4.57838e-07 10.333L0.499756 10.9577L1.28062 10.333ZM10.2806 11.333C10.8329 11.333 11.2806 10.8853 11.2806 10.333C11.2806 9.78072 10.8329 9.33301 10.2806 9.33301V10.333V11.333ZM5.28062 5.33301L4.49976 4.70831L0.499756 9.70831L1.28062 10.333L2.06149 10.9577L6.06149 5.9577L5.28062 5.33301ZM1.28062 10.333L0.499756 10.9577L4.49976 15.9577L5.28062 15.333L6.06149 14.7083L2.06149 9.70831L1.28062 10.333ZM1.28062 10.333V11.333H10.2806V10.333V9.33301H1.28062V10.333Z" fill="#000"/>
          </Svg>
        </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.statCard, styles.balanceCard]}
        onPress={() => setShowBalanceModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text
          style={[
            styles.balanceAmount,
            balance >= 0 ? styles.positiveBalance : styles.negativeBalance,
          ]}
        >
          {formatCurrency(balance)}
        </Text>
        <Text style={styles.balanceNote}>Tap for more information</Text>
      </TouchableOpacity>

      {/* Balance Detail Modal */}
      <Modal
        visible={showBalanceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Balance Details</Text>
              <TouchableOpacity onPress={() => setShowBalanceModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalTotalLabel}>Total Balance</Text>
              <Text style={[
                styles.modalTotalAmount,
                balance >= 0 ? styles.positiveBalance : styles.negativeBalance,
              ]}>
                {formatCurrency(balance)}
              </Text>
              
              <View style={styles.modalDivider} />
              
              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>Personal:</Text>
                <Text style={[
                  styles.modalRowAmount,
                  personalBalance >= 0 ? styles.positiveBalance : styles.negativeBalance,
                ]}>
                  {formatCurrency(personalBalance)}
                </Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>Group:</Text>
                <Text style={[
                  styles.modalRowAmount,
                  groupBalance >= 0 ? styles.positiveBalance : styles.negativeBalance,
                ]}>
                  {formatCurrency(groupBalance)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/debt/add')}
        >
          <Text style={styles.actionButtonIcon}>💳</Text>
          <Text style={styles.actionButtonText}>Debt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/all')}
        >
          <Text style={styles.actionButtonIcon}>📈</Text>
          <Text style={styles.actionButtonText}>Summary</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receive' && styles.activeTab]}
          onPress={() => setActiveTab('receive')}
        >
          <Text style={[styles.tabText, activeTab === 'receive' && styles.activeTabText]}>
            Receive
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'toPay' && styles.activeTab]}
          onPress={() => setActiveTab('toPay')}
        >
          <Text style={[styles.tabText, activeTab === 'toPay' && styles.activeTabText]}>
            to Pay
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debt List */}
      <FlatList
        data={displayDebts}
        renderItem={renderDebtItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.debtList}
        ListHeaderComponent={
          activeTab === 'receive' && pendingCount > 0 ? (
            <TouchableOpacity
              style={styles.pendingNotification}
              onPress={() => router.push('/debt/pending')}
            >
              <View style={styles.pendingIcon}>
                <Text style={styles.pendingIconText}>⏰</Text>
              </View>
              <View style={styles.pendingContent}>
                <Text style={styles.pendingTitle}>Transaction pending!</Text>
                <Text style={styles.pendingSubtitle}>Tap to view this transaction</Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'receive' ? 'No debts to receive' : 'No debts to pay'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 75,
    backgroundColor: '#ffffff',
  },
  headerDark: {
    backgroundColor: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
  textDark: {
    color: '#ffffff',
  },
  pendingNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pendingIconText: {
    fontSize: 20,
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 15,
    fontFamily: Font.semiBold,
    color: '#111827',
    marginBottom: 4,
  },
  pendingSubtitle: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#9ca3af',
  },
  greeting: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: '#000000ff',
  },
  userName: {
    fontSize: 24,
    fontFamily: Font.bold,
    color: '#000000ff',
    marginTop: 1,
  },
  logoutButton: {
    padding: 8,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 15,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: Font.bold,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 29,
    fontFamily: Font.bold,
    marginBottom: 8,
  },
  positiveBalance: {
    color: '#059669',
  },
  negativeBalance: {
    color: '#dc2626',
  },
  balanceNote: {
    fontSize: 11,
    fontFamily: Font.regular,
    color: '#999',
    textAlign: 'right',
    marginTop: undefined,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 40,
    marginTop: 5,
    marginBottom: 30,
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: '#94ddffff',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: Font.semiBold,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000ff',
  },
  tabText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#000000ff',
    fontFamily: Font.semiBold,
  },
  debtList: {
    paddingHorizontal: 16,
    paddingTop: 1,
    paddingBottom: 120,
  },
  debtCard: {
    backgroundColor: '#ffffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debtAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Font.bold,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#111827',
    marginBottom: 4,
  },
  debtDate: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#9ca3af',
  },
  debtAmount: {
    fontSize: 16,
    fontFamily: Font.bold,
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#9ca3af',
  },
  modalBody: {
    padding: 20,
  },
  modalTotalLabel: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#666',
    marginBottom: 8,
  },
  modalTotalAmount: {
    fontSize: 32,
    fontFamily: Font.bold,
    marginBottom: 20,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRowLabel: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: '#111827',
  },
  modalRowAmount: {
    fontSize: 18,
    fontFamily: Font.bold,
  },
});
