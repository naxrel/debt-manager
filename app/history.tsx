import { groupsApi, groupTransactionsApi } from '@/api';
import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

type TransactionItem =
  | { type: 'personal'; data: any }
  | { type: 'group'; data: any; groupName: string };

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { debts, isLoading, refreshDebts } = useDebt();
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'group'>('all');
  const [groupTransactions, setGroupTransactions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const loadGroupTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const userGroups = await groupsApi.getAll();
      setGroups(userGroups);

      const allTransactions: any[] = [];
      for (const group of userGroups) {
        const groupTrans = await groupTransactionsApi.getAll(group.id);
        allTransactions.push(...groupTrans);
      }
      setGroupTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading group transactions:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshDebts();
      loadGroupTransactions();
    }
  }, [user]); // Remove refreshDebts and loadGroupTransactions from dependencies to prevent infinite loop

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
      const group = groups.find(g => g.id === gt.groupId);
      return {
        type: 'group' as const,
        data: gt,
        groupName: group?.name || 'Unknown Group',
      };
    });

    switch (activeTab) {
      case 'personal':
        return personalTransactions;
      case 'group':
        return groupTransactionItems;
      default:
        return [...personalTransactions, ...groupTransactionItems].sort((a, b) => {
          return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
        });
    }
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const renderTransactionItem = ({ item, index }: { item: TransactionItem; index: number }) => {
    if (item.type === 'personal') {
      return (
        <AnimatedTouchable
          entering={FadeInDown.delay(index * 50).duration(300).easing(Easing.out(Easing.ease))}
          style={styles.debtCard}
          // onPress={() => router.push(`/debt/detail?id=${item.data.id}`)} // Route deleted
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {item.data.type === 'hutang' ? 'Hutang' : 'Piutang'}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.data.date)}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.debtName}>{item.data.name}</Text>
              {item.data.description ? (
                <Text style={styles.debtDescription}>{item.data.description}</Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.debtAmount,
                item.data.type === 'hutang' ? styles.negativeAmount : styles.positiveAmount,
              ]}
            >
              {item.data.type === 'hutang' ? '-' : '+'}
              {formatCurrency(item.data.amount)}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.statusText,
                item.data.status === 'confirmed' ? styles.confirmedStatus : styles.pendingStatus,
              ]}
            >
              {item.data.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
            </Text>
          </View>
        </AnimatedTouchable>
      );
    } else {
      // For group transactions, user info is in the transaction data
      const isUserPaying = user && item.data.fromUserId === user.userId;

      return (
        <AnimatedTouchable
          entering={FadeInDown.delay(index * 50).duration(300).easing(Easing.out(Easing.ease))}
          style={styles.debtCard}
          onPress={() => router.push(`/group/${item.data.groupId}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.typeBadge, styles.groupBadge]}>
              <Text style={styles.typeBadgeText}>Group</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.data.date)}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.debtName}>{item.groupName}</Text>
              <Text style={styles.debtDescription}>
                Transaction in group
              </Text>
              {item.data.description ? (
                <Text style={styles.debtDescription}>{item.data.description}</Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.debtAmount,
                isUserPaying ? styles.negativeAmount : styles.positiveAmount,
              ]}
            >
              {isUserPaying ? '-' : '+'}
              {formatCurrency(item.data.amount)}
            </Text>
          </View>
        </AnimatedTouchable>
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const filteredTransactions = getFilteredTransactions();

  // Animated FAB
  const Fab = ({ onPress }: { onPress: () => void }) => (
    <AnimatedTouchable
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.fabText}>+</Text>
    </AnimatedTouchable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({debts.length + groupTransactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            Personal ({debts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'group' && styles.activeTab]}
          onPress={() => setActiveTab('group')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'group' && styles.activeTabText]}>
            Grup ({groupTransactions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item, index) =>
            item.type === 'personal' ? `personal-${item.data.id}` : `group-${item.data.id}`
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      <Fab onPress={() => router.push('/debt/add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: '#000000',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    cursor: 'pointer' as any,
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#666',
  },
  activeTabText: {
    color: '#2563eb',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  debtCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    // Animation: scale on press/hover (web)
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '200ms',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  groupBadge: {
    backgroundColor: '#f0fdf4',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#2563eb',
  },
  dateText: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#9ca3af',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#1f2937',
    marginBottom: 4,
  },
  debtDescription: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#6b7280',
  },
  debtAmount: {
    fontSize: 18,
    fontFamily: Font.bold,
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Font.semiBold,
  },
  confirmedStatus: {
    color: '#10b981',
  },
  pendingStatus: {
    color: '#f59e0b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: '#9ca3af',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    // Animation
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '200ms',
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
