import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { Debt, StaticDB } from '@/data/staticDatabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface GroupSummary {
  groupId: string;
  groupName: string;
  myHutang: number;
  myPiutang: number;
  myBalance: number;
  memberCount: number;
}

export default function MultiGroupOverviewScreen() {
  const { user } = useAuth();
  const { refreshDebts } = useDebt();
  const router = useRouter();
  const [groupSummaries, setGroupSummaries] = useState<GroupSummary[]>([]);
  const [personalDebts, setPersonalDebts] = useState<Debt[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      calculateSummaries();
    }
  }, [user]);

  const calculateSummaries = () => {
    if (!user) return;

    // Calculate group summaries
    const userGroups = StaticDB.getUserGroups(user.id);
    const summaries: GroupSummary[] = userGroups.map(group => {
      const transactions = StaticDB.getGroupTransactions(group.id);
      let myHutang = 0;
      let myPiutang = 0;

      transactions.forEach(t => {
        if (t.fromUserId === user.id) {
          myHutang += t.amount;
        }
        if (t.toUserId === user.id) {
          myPiutang += t.amount;
        }
      });

      return {
        groupId: group.id,
        groupName: group.name,
        myHutang,
        myPiutang,
        myBalance: myPiutang - myHutang,
        memberCount: group.memberIds.length,
      };
    });

    setGroupSummaries(summaries);

    // Get personal debts (outside groups)
    const allDebts = StaticDB.getDebtsByUserId(user.id);
    setPersonalDebts(allDebts);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshDebts();
    calculateSummaries();
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

  // Calculate totals
  const totalGroupHutang = groupSummaries.reduce((sum, g) => sum + g.myHutang, 0);
  const totalGroupPiutang = groupSummaries.reduce((sum, g) => sum + g.myPiutang, 0);
  const totalPersonalHutang = personalDebts.filter(d => d.type === 'hutang' && !d.isPaid).reduce((sum, d) => sum + d.amount, 0);
  const totalPersonalPiutang = personalDebts.filter(d => d.type === 'piutang' && !d.isPaid).reduce((sum, d) => sum + d.amount, 0);
  const grandTotalBalance = (totalGroupPiutang + totalPersonalPiutang) - (totalGroupHutang + totalPersonalHutang);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Multi-Group Overview</Text>
        <Text style={styles.headerSubtitle}>
          Ringkasan hutang piutang dari semua grup & personal
        </Text>
      </View>

      {/* Total Balance Card */}
      <View style={styles.totalBalanceCard}>
        <Text style={styles.cardTitle}>Total Keseluruhan</Text>
        <Text
          style={[
            styles.balanceAmount,
            grandTotalBalance >= 0
              ? styles.positiveBalance
              : styles.negativeBalance,
          ]}
        >
          {formatCurrency(grandTotalBalance)}
        </Text>
        <View style={styles.balanceBreakdown}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Piutang</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(totalGroupPiutang + totalPersonalPiutang)}
            </Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Hutang</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(totalGroupHutang + totalPersonalHutang)}
            </Text>
          </View>
        </View>
      </View>

      {/* Group Summaries */}
      {groupSummaries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Ringkasan Per Grup</Text>
          {groupSummaries.map((group) => (
            <TouchableOpacity
              key={group.groupId}
              style={styles.groupCard}
              onPress={() => router.push(`/group/${group.groupId}`)}
            >
              <View style={styles.groupHeader}>
                <View>
                  <Text style={styles.groupName}>{group.groupName}</Text>
                  <Text style={styles.groupMeta}>{group.memberCount} anggota</Text>
                </View>
                <Text style={styles.groupArrow}>›</Text>
              </View>
              <View style={styles.groupStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Piutang</Text>
                  <Text style={[styles.statValue, styles.positiveText]}>
                    {formatCurrency(group.myPiutang)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Hutang</Text>
                  <Text style={[styles.statValue, styles.negativeText]}>
                    {formatCurrency(group.myHutang)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Saldo</Text>
                  <Text
                    style={[
                      styles.statValue,
                      styles.statValueBold,
                      group.myBalance >= 0 ? styles.positiveText : styles.negativeText,
                    ]}
                  >
                    {formatCurrency(group.myBalance)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Personal Debts */}
      {personalDebts.filter(d => !d.isPaid).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💼 Hutang Personal</Text>
          <Text style={styles.sectionSubtitle}>
            Hutang di luar grup (belum dimasukkan ke grup manapun)
          </Text>
          {personalDebts
            .filter(d => !d.isPaid)
            .map((debt) => (
              <View key={debt.id} style={styles.personalDebtCard}>
                <View style={styles.debtHeader}>
                  <Text style={styles.debtName}>{debt.name}</Text>
                  <Text
                    style={[
                      styles.debtAmount,
                      debt.type === 'piutang' ? styles.positiveText : styles.negativeText,
                    ]}
                  >
                    {formatCurrency(debt.amount)}
                  </Text>
                </View>
                <Text style={styles.debtDescription}>{debt.description}</Text>
                <View style={styles.debtMeta}>
                  <Text style={styles.debtType}>
                    {debt.type === 'hutang' ? '💸 Anda berhutang' : '💰 Orang berhutang'}
                  </Text>
                  <Text style={styles.debtDate}>
                    {new Date(debt.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Empty State */}
      {groupSummaries.length === 0 && personalDebts.filter(d => !d.isPaid).length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>Tidak ada hutang piutang</Text>
          <Text style={styles.emptySubtext}>Mulai buat grup atau tambah hutang personal</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Klik grup untuk melihat detail & optimasi hutang
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
  header: {
    backgroundColor: '#344170',
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
  totalBalanceCard: {
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
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  positiveBalance: {
    color: '#059669',
  },
  negativeBalance: {
    color: '#dc2626',
  },
  balanceBreakdown: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#344170',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  groupCard: {
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 13,
    color: '#999',
  },
  groupArrow: {
    fontSize: 32,
    color: '#344170',
    fontWeight: '300',
  },
  groupStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  statValueBold: {
    fontWeight: 'bold',
  },
  positiveText: {
    color: '#059669',
  },
  negativeText: {
    color: '#dc2626',
  },
  personalDebtCard: {
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
  },
  debtDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  debtMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtType: {
    fontSize: 12,
    color: '#666',
  },
  debtDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    margin: 16,
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
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
