import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { Debt, GroupTransaction, StaticDB } from '@/data/staticDatabase';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';

// --- DESIGN TOKENS ---
const COLORS = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTertiary: '#94A3B8',
  border: '#F1F5F9',
  success: '#10B981',
  danger: '#EF4444',
  inputBg: '#F8FAFC',
};

const SPACING = 20;

type TransactionItem = 
  | { type: 'personal'; data: Debt }
  | { type: 'group'; data: GroupTransaction; groupName: string };

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { debts, isLoading, refreshDebts } = useDebt();
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'group'>('all');
  const [groupTransactions, setGroupTransactions] = useState<GroupTransaction[]>([]);

  const loadGroupTransactions = useCallback(() => {
    if (!user) return;
    const userGroups = StaticDB.getUserGroups(user.id);
    const allTransactions: GroupTransaction[] = [];
    userGroups.forEach(group => {
      const groupTrans = StaticDB.getGroupTransactions(group.id);
      allTransactions.push(...groupTrans);
    });
    setGroupTransactions(allTransactions);
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshDebts();
      loadGroupTransactions();
    }
  }, [user]);

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

  const getFilteredTransactions = (): TransactionItem[] => {
    const personalTransactions: TransactionItem[] = debts.map(debt => ({
      type: 'personal' as const,
      data: debt,
    }));

    const groupTransactionItems: TransactionItem[] = groupTransactions.map(gt => {
      const group = StaticDB.getGroupById(gt.groupId);
      return {
        type: 'group' as const,
        data: gt,
        groupName: group?.name || 'Unknown Group',
      };
    });

    let items = [];
    switch (activeTab) {
      case 'personal':
        items = personalTransactions;
        break;
      case 'group':
        items = groupTransactionItems;
        break;
      default:
        items = [...personalTransactions, ...groupTransactionItems];
    }
    
    return items.sort((a, b) => {
      return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
    });
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const renderTransactionItem = ({ item, index }: { item: TransactionItem; index: number }) => {
    const isPersonal = item.type === 'personal';
    let isIncome = false; // Income = Uang Masuk (Positif)
    let title = '';
    let subtitle = '';
    let amount = 0;
    
    // Logic Penentuan Tampilan
    if (isPersonal) {
        // Personal Debt
        // Piutang = Kita meminjamkan (Uang keluar dulu, nanti masuk) -> Context History: Piutang = Positive Asset
        // Hutang = Kita pinjam (Uang masuk, tapi jadi beban) -> Context History: Hutang = Negative Asset
        // Sederhananya: 
        // Type 'piutang' (Orang utang ke kita) -> Green
        // Type 'hutang' (Kita utang orang) -> Red
        isIncome = item.data.type === 'piutang'; 
        title = item.data.name;
        subtitle = isPersonal ? (item.data.description || 'Personal Debt') : '';
        amount = item.data.amount;
    } else {
        // Group Transaction
        const fromUser = StaticDB.getUserById(item.data.fromUserId);
        // const toUser = StaticDB.getUserById(item.data.toUserId);
        const isUserPaying = user && item.data.fromUserId === user.id; // Kita yang bayar
        
        isIncome = !isUserPaying; // Kalau bukan kita yang bayar, anggap expense (atau logic bisa disesuaikan)
        // Di context group expense:
        // Kalau kita bayar (Expense) -> Red
        // Kalau orang lain bayar buat kita (Benefit?) -> Green? 
        // Usually history shows CASH FLOW.
        // Let's simplify: 
        // If I paid -> Red (Money out)
        // If someone paid me -> Green (Money in)
        
        isIncome = !isUserPaying; 
        title = item.groupName;
        subtitle = `${fromUser?.name} paid`;
        amount = item.data.amount;
    }

    return (
      <AnimatedTouchable
        entering={FadeInDown.delay(index * 50).duration(300).easing(Easing.out(Easing.ease))}
        style={styles.transactionItem}
        onPress={() => {
            if (isPersonal) {
                router.push(`/debt/detail?id=${item.data.id}`);
            } else {
                router.push(`/group/${item.data.groupId}`);
            }
        }}
        activeOpacity={0.7}
      >
        {/* Left Icon with Background */}
        <View style={[
            styles.iconContainer, 
            { backgroundColor: isIncome ? COLORS.success + '15' : COLORS.danger + '15' }
        ]}>
             <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                {isIncome ? (
                    <Path d="M12 19V5M5 12l7-7 7 7" stroke={COLORS.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                    <Path d="M12 5v14M5 12l7 7 7-7" stroke={COLORS.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                )}
             </Svg>
        </View>

        {/* Content */}
        <View style={styles.itemContent}>
            <View style={styles.textWrapper}>
                <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {formatDate(item.data.date)} • {subtitle}
                </Text>
            </View>
            
            <View style={styles.amountWrapper}>
                <Text style={[
                    styles.itemAmount,
                    { color: isIncome ? COLORS.success : COLORS.danger }
                ]}>
                    {isIncome ? '+' : '-'} {formatCurrency(amount)}
                </Text>
                
                {/* Status Badge Small */}
                {isPersonal && item.data.status === 'pending' && (
                    <View style={styles.pendingDot} />
                )}
            </View>
        </View>
      </AnimatedTouchable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const filteredTransactions = getFilteredTransactions();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke={COLORS.textMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* TABS (Pill Shaped) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'all' && styles.activeTabPill]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'personal' && styles.activeTabPill]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>Personal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'group' && styles.activeTabPill]}
          onPress={() => setActiveTab('group')}
        >
          <Text style={[styles.tabText, activeTab === 'group' && styles.activeTabText]}>Groups</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No History</Text>
          <Text style={styles.emptyText}>You haven't made any transactions yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item, index) => 
            item.type === 'personal' ? `personal-${item.data.id}` : `group-${item.data.id}`
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/debt/add')}
        activeOpacity={0.9}
      >
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
           <Path d="M12 5v14M5 12h14" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING,
    marginBottom: 20,
    gap: 12,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: COLORS.textSec,
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // List Item
  listContent: {
    paddingHorizontal: SPACING,
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    // Optional Shadow
    // shadowColor: COLORS.textMain,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.03,
    // shadowRadius: 8,
    // elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16, // Squircle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },
  amountWrapper: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontFamily: Font.bold,
  },
  pendingDot: {
    marginTop: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B', // Amber/Orange for pending
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textSec,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING,
    bottom: 30,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});