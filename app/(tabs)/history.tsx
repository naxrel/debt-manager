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

type TransactionItem = 
  | { type: 'personal'; data: Debt }
  | { type: 'group'; data: GroupTransaction; groupName: string };

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { debts, isLoading, refreshDebts, getHutangList, getPiutangList } = useDebt();
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
        >
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>Personal</Text>
            </View>
            {item.data.isPaid && <Text style={styles.paidBadge}>✓ Lunas</Text>}
          </View>
          <View style={styles.debtHeader}>
            <View style={styles.debtNameContainer}>
              <Text style={styles.debtName}>{item.data.name}</Text>
              <Text
                style={[
                  styles.debtType,
                  item.data.type === 'hutang' ? styles.hutangBadge : styles.piutangBadge,
                ]}
              >
                {item.data.type === 'hutang' ? 'Hutang' : 'Piutang'}
              </Text>
            </View>
          </View>
          <Text style={styles.debtAmount}>{formatCurrency(item.data.amount)}</Text>
          <Text style={styles.debtDate}>{formatDate(item.data.date)}</Text>
          {item.data.description && (
            <Text style={styles.debtDescription} numberOfLines={2}>
              {item.data.description}
            </Text>
          )}
        </TouchableOpacity>
      );
    } else {
      const fromUser = StaticDB.getUserById(item.data.fromUserId);
      const toUser = StaticDB.getUserById(item.data.toUserId);
      return (
        <TouchableOpacity
          style={styles.debtCard}
          onPress={() => router.push(`/group/${item.data.groupId}`)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.typeBadge, styles.groupBadge]}>
              <Text style={styles.typeText}>Grup: {item.groupName}</Text>
            </View>
            {item.data.isPaid && <Text style={styles.paidBadge}>✓ Lunas</Text>}
          </View>
          <View style={styles.groupTransactionInfo}>
            <Text style={styles.transactionUsers}>
              {fromUser?.name} → {toUser?.name}
            </Text>
          </View>
          <Text style={styles.debtAmount}>{formatCurrency(item.data.amount)}</Text>
          <Text style={styles.debtDate}>{formatDate(item.data.date)}</Text>
          {item.data.description && (
            <Text style={styles.debtDescription} numberOfLines={2}>
              {item.data.description}
            </Text>
          )}
        </TouchableOpacity>
      );
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Silakan login terlebih dahulu</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>History Transaksi</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Semua ({debts.length + groupTransactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            Personal ({debts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'group' && styles.activeTab]}
          onPress={() => setActiveTab('group')}
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
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#2563eb',
  },
  listContent: {
    padding: 16,
  },
  debtCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  groupBadge: {
    backgroundColor: '#f3e8ff',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  groupTransactionInfo: {
    marginBottom: 8,
  },
  transactionUsers: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  debtNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  debtType: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  hutangBadge: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  piutangBadge: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  paidBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  debtAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  debtDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  debtDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
