import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { StaticDB } from '@/data/staticDatabase';
import { DebtOptimizer, OptimizedDebt, UserBalance } from '@/utils/debtOptimizer';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function GroupDebtScreen() {
  const { user } = useAuth();
  const { debts, isLoading, refreshDebts } = useDebt();
  const [optimizedDebts, setOptimizedDebts] = useState<OptimizedDebt[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      calculateOptimizedDebts();
    }
  }, [debts, user]);

  const calculateOptimizedDebts = () => {
    const allUsers = StaticDB.getUsers();
    const allDebts = StaticDB.getUsers().flatMap(u => 
      StaticDB.getDebtsByUserId(u.id)
    );

    const result = DebtOptimizer.getOptimizedDebtGraph(allDebts, allUsers);
    setOptimizedDebts(result.optimizedDebts);
    setUserBalances(result.balances);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshDebts();
    calculateOptimizedDebts();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const myOptimizedDebts = DebtOptimizer.getUserSuggestions(user.id, optimizedDebts);
  const myBalance = userBalances.find(b => b.userId === user.id);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Optimasi Hutang Grup</Text>
        <Text style={styles.headerSubtitle}>
          Sistem otomatis menyederhanakan hutang antar member
        </Text>
      </View>

      {/* My Balance Card */}
      <View style={styles.myBalanceCard}>
        <Text style={styles.cardTitle}>Saldo Anda</Text>
        <Text
          style={[
            styles.balanceAmount,
            (myBalance?.balance || 0) >= 0
              ? styles.positiveBalance
              : styles.negativeBalance,
          ]}
        >
          {formatCurrency(myBalance?.balance || 0)}
        </Text>
        <Text style={styles.balanceNote}>
          {(myBalance?.balance || 0) >= 0
            ? `${Math.abs(myBalance?.balance || 0) > 0 ? 'Orang berhutang ke Anda' : 'Anda tidak punya hutang/piutang'}`
            : 'Anda berhutang ke orang lain'}
        </Text>
      </View>

      {/* My Actions */}
      {(myOptimizedDebts.shouldPay.length > 0 || myOptimizedDebts.willReceive.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aksi Anda</Text>

          {myOptimizedDebts.shouldPay.length > 0 && (
            <View style={styles.actionSection}>
              <Text style={styles.actionLabel}>💸 Anda Harus Bayar:</Text>
              {myOptimizedDebts.shouldPay.map((debt, index) => (
                <View key={index} style={[styles.debtCard, styles.payCard]}>
                  <View style={styles.debtHeader}>
                    <Text style={styles.debtName}>{debt.toName}</Text>
                    <Text style={styles.debtAmount}>{formatCurrency(debt.amount)}</Text>
                  </View>
                  <Text style={styles.debtNote}>
                    Bayar ke {debt.toName} untuk menyelesaikan semua hutang Anda
                  </Text>
                </View>
              ))}
            </View>
          )}

          {myOptimizedDebts.willReceive.length > 0 && (
            <View style={styles.actionSection}>
              <Text style={styles.actionLabel}>💰 Anda Akan Terima:</Text>
              {myOptimizedDebts.willReceive.map((debt, index) => (
                <View key={index} style={[styles.debtCard, styles.receiveCard]}>
                  <View style={styles.debtHeader}>
                    <Text style={styles.debtName}>{debt.fromName}</Text>
                    <Text style={styles.debtAmount}>{formatCurrency(debt.amount)}</Text>
                  </View>
                  <Text style={styles.debtNote}>
                    {debt.fromName} akan membayar ke Anda
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* All Optimized Debts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Semua Transaksi Optimal</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{optimizedDebts.length} transaksi</Text>
          </View>
        </View>

        {optimizedDebts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Tidak ada hutang dalam grup!</Text>
            <Text style={styles.emptySubtext}>Semua sudah lunas</Text>
          </View>
        ) : (
          <View style={styles.graphContainer}>
            <Text style={styles.graphNote}>
              💡 Dengan {optimizedDebts.length} transaksi, semua hutang bisa diselesaikan
            </Text>
            {optimizedDebts.map((debt, index) => (
              <View key={index} style={styles.graphCard}>
                <View style={styles.graphRow}>
                  <View style={styles.userBadge}>
                    <Text style={styles.userBadgeText}>{debt.fromName}</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>→</Text>
                    <Text style={styles.arrowAmount}>{formatCurrency(debt.amount)}</Text>
                  </View>
                  <View style={styles.userBadge}>
                    <Text style={styles.userBadgeText}>{debt.toName}</Text>
                  </View>
                </View>
                {(debt.from === user.id || debt.to === user.id) && (
                  <View style={styles.highlightBadge}>
                    <Text style={styles.highlightText}>
                      {debt.from === user.id ? '← Anda bayar' : 'Anda terima →'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* All Users Balance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saldo Semua Member</Text>
        {userBalances
          .filter(b => Math.abs(b.balance) > 0)
          .sort((a, b) => b.balance - a.balance)
          .map((balance, index) => (
            <View
              key={index}
              style={[
                styles.userBalanceCard,
                balance.userId === user.id && styles.currentUserCard,
              ]}
            >
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {balance.userName}
                  {balance.userId === user.id && ' (Anda)'}
                </Text>
                <Text
                  style={[
                    styles.userBalance,
                    balance.balance >= 0 ? styles.positiveText : styles.negativeText,
                  ]}
                >
                  {formatCurrency(balance.balance)}
                </Text>
              </View>
              <Text style={styles.userStatus}>
                {balance.balance > 0
                  ? `Akan menerima ${formatCurrency(balance.balance)}`
                  : `Harus bayar ${formatCurrency(Math.abs(balance.balance))}`}
              </Text>
            </View>
          ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔄 Sistem otomatis menghitung jalur pembayaran paling efisien
        </Text>
      </View>
    </ScrollView>
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
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  myBalanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  positiveBalance: {
    color: '#059669',
  },
  negativeBalance: {
    color: '#dc2626',
  },
  balanceNote: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
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
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionSection: {
    marginBottom: 20,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
  payCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  receiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
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
  debtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  debtNote: {
    fontSize: 13,
    color: '#666',
  },
  graphContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  graphNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  graphCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  graphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  userBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    textAlign: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  arrow: {
    fontSize: 20,
    color: '#2563eb',
  },
  arrowAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 4,
  },
  highlightBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  userBalanceCard: {
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
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userBalance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveText: {
    color: '#059669',
  },
  negativeText: {
    color: '#dc2626',
  },
  userStatus: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
