import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { Debt, GroupTransaction, StaticDB } from '@/data/staticDatabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

type TransactionItem = 
  | { type: 'personal'; data: Debt }
  | { type: 'group'; data: GroupTransaction; groupName: string };

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { debts, isLoading, refreshDebts } = useDebt();
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'group'>('all');
  const [groupTransactions, setGroupTransactions] = useState<GroupTransaction[]>([]);

  useEffect(() => {
    if (user) {
      refreshDebts();
      loadGroupTransactions();
    }
  }, [user]);

  const loadGroupTransactions = () => {
    if (!user) return;
    const userGroups = StaticDB.getUserGroups(user.id);
    const allTransactions: GroupTransaction[] = [];
    userGroups.forEach(group => {
      const groupTrans = StaticDB.getGroupTransactions(group.id);
      allTransactions.push(...groupTrans);
    });
    setGroupTransactions(allTransactions);
  };

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

    switch (activeTab) {
      case 'personal':
        return personalTransactions;
      case 'group':
        return groupTransactionItems;
      default:
        return [...personalTransactions, ...groupTransactionItems].sort((a, b) => {
          const dateA = a.type === 'personal' ? a.data.date : a.data.date;
          const dateB = b.type === 'personal' ? b.data.date : b.data.date;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }
  };

  const renderTransactionItem = ({ item }: { item: TransactionItem }) => {
    if (item.type === 'personal') {
      return (
        <TouchableOpacity
          style={styles.debtCard}
          onPress={() => router.push(`/debt/detail?id=${item.data.id}`)}
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
        </TouchableOpacity>
      );
    } else {
      const fromUser = StaticDB.getUserById(item.data.fromUserId);
      const toUser = StaticDB.getUserById(item.data.toUserId);
      const isUserPaying = user && item.data.fromUserId === user.id;

      return (
        <TouchableOpacity
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
                {fromUser?.name} → {toUser?.name}
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
        </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History Transaksi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Semua ({debts.length + groupTransactions.length})
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
          <Text style={styles.emptyText}>Tidak ada transaksi</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/debt/add')}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ Tambah Transaksi</Text>
          </TouchableOpacity>
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
  addButtonText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#ffffff',
  },
});
