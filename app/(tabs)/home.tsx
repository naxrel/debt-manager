import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { Debt, StaticDB } from '@/data/staticDatabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { debts, isLoading: debtLoading, getStatistics, refreshDebts } = useDebt();
  const [groupStats, setGroupStats] = useState({ totalHutang: 0, totalPiutang: 0 });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      refreshDebts();
      calculateGroupStats();
      calculatePendingCount();
    }
  }, [user]);

  // Refresh pending count when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        calculatePendingCount();
      }
    }, [user])
  );

  const calculatePendingCount = () => {
    if (!user) return;
    const pending = StaticDB.getPendingDebtsForUser(user.id);
    setPendingCount(pending.length);
  };

  const calculateGroupStats = () => {
    if (!user) return;

    const userGroups = StaticDB.getUserGroups(user.id);
    let totalHutang = 0;
    let totalPiutang = 0;

    userGroups.forEach(group => {
      const transactions = StaticDB.getGroupTransactions(group.id);
      
      transactions.forEach(t => {
        if (t.fromUserId === user.id) {
          // User berhutang (negative)
          totalHutang += t.amount;
        }
        if (t.toUserId === user.id) {
          // User dibayar (positive)
          totalPiutang += t.amount;
        }
      });
    });

    setGroupStats({ totalHutang, totalPiutang });
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

  const personalStats = getStatistics();
  
  // Combine personal + group stats
  const stats = {
    totalHutang: personalStats.totalHutang + groupStats.totalHutang,
    totalPiutang: personalStats.totalPiutang + groupStats.totalPiutang,
    countHutang: personalStats.countHutang,
    countPiutang: personalStats.countPiutang,
    balance: (personalStats.totalPiutang + groupStats.totalPiutang) - (personalStats.totalHutang + groupStats.totalHutang),
  };
  // Get pending debts for current user
  const pendingDebts = StaticDB.getPendingDebtsForUser(user.id);
  
  // Combine pending debts with regular debts
  const allRecentDebts = [
    ...pendingDebts, // Pending debts first
    ...debts.filter(d => !d.isPaid && d.status === 'confirmed'), // Then confirmed debts
  ];
  
  const recentDebts = allRecentDebts
    .sort((a, b) => {
      // Prioritize pending status, then sort by date
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 5);

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
    const isPending = item.status === 'pending';
    const initiator = isPending ? StaticDB.getUserById(item.initiatedBy) : null;

    return (
      <TouchableOpacity
        style={[styles.debtCard, isPending && styles.pendingDebtCard]}
        activeOpacity={0.7}
        onPress={() => {
          if (isPending) {
            router.push('/debt/pending');
          } else {
            router.push(`/debt/detail?id=${item.id}`);
          }
        }}
      >
        <View style={styles.debtHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.debtName}>{item.name}</Text>
            {isPending && initiator && (
              <Text style={styles.pendingLabel}>
                ⏳ Menunggu persetujuan (@{initiator.username})
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.debtType,
              isPending
                ? styles.pendingBadge
                : item.type === 'hutang'
                ? styles.hutangBadge
                : styles.piutangBadge,
            ]}
          >
            {isPending ? 'Pending' : item.type === 'hutang' ? 'Hutang' : 'Piutang'}
          </Text>
        </View>
        <Text style={styles.debtAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.debtDate}>{formatDate(item.date)}</Text>
        {item.description && (
          <Text style={styles.debtDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        {isPending && (
          <View style={styles.pendingActionHint}>
            <Text style={styles.pendingActionText}>Tap untuk approve/reject →</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Approvals Notification */}
      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingNotification}
          onPress={() => router.push('/debt/pending')}
        >
          <View style={styles.pendingIcon}>
            <Text style={styles.pendingIconText}>⏳</Text>
          </View>
          <View style={styles.pendingContent}>
            <Text style={styles.pendingTitle}>
              {pendingCount} Transaksi Menunggu Persetujuan
            </Text>
            <Text style={styles.pendingSubtitle}>
              Tap untuk melihat dan approve/reject
            </Text>
          </View>
          <View style={styles.pendingNotificationBadge}>
            <Text style={styles.pendingNotificationBadgeText}>{pendingCount}</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.hutangCard]}>
          <Text style={styles.statLabel}>Total Hutang</Text>
          <Text style={styles.statAmount}>{formatCurrency(stats.totalHutang)}</Text>
          <Text style={styles.statCount}>{stats.countHutang} transaksi</Text>
        </View>

        <View style={[styles.statCard, styles.piutangCard]}>
          <Text style={styles.statLabel}>Total Piutang</Text>
          <Text style={styles.statAmount}>{formatCurrency(stats.totalPiutang)}</Text>
          <Text style={styles.statCount}>{stats.countPiutang} transaksi</Text>
        </View>
      </View>

      <View style={[styles.statCard, styles.balanceCard]}>
        <Text style={styles.balanceLabel}>Saldo Bersih</Text>
        <Text
          style={[
            styles.balanceAmount,
            stats.balance >= 0 ? styles.positiveBalance : styles.negativeBalance,
          ]}
        >
          {formatCurrency(stats.balance)}
        </Text>
        <Text style={styles.balanceNote}>
          {stats.balance >= 0
            ? 'Anda memiliki surplus'
            : 'Anda memiliki defisit'}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Action</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/all')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Multi-Group</Text>
            <Text style={styles.actionSubtitle}>Ringkasan semua grup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/group')}
          >
            <Text style={styles.actionIcon}>🤝</Text>
            <Text style={styles.actionTitle}>Lihat Grup</Text>
            <Text style={styles.actionSubtitle}>Optimasi pembayaran</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/debt/add')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionTitle}>Tambah</Text>
            <Text style={styles.actionSubtitle}>Hutang/piutang</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/history')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionSubtitle}>Semua transaksi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>

        {recentDebts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={recentDebts}
              renderItem={renderDebtItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/history')}
            >
              <Text style={styles.viewAllText}>Lihat Semua →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2563eb',
  },
  pendingNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    cursor: 'pointer' as any,
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
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
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  pendingSubtitle: {
    fontSize: 13,
    color: '#b45309',
  },
  pendingNotificationBadge: {
    backgroundColor: '#f59e0b',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingNotificationBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hutangCard: {
    backgroundColor: '#fee2e2',
  },
  piutangCard: {
    backgroundColor: '#d1fae5',
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statCount: {
    fontSize: 12,
    color: '#999',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  positiveBalance: {
    color: '#059669',
  },
  negativeBalance: {
    color: '#dc2626',
  },
  balanceNote: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  debtCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  debtType: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  pendingBadge: {
    backgroundColor: '#fef3c7',
    color: '#f59e0b',
  },
  pendingDebtCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  pendingLabel: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 4,
  },
  pendingActionHint: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fde68a',
  },
  pendingActionText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
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
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  addFirstButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  viewAllButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});
