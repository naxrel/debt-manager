import { useAuth } from '@/contexts/AuthContext';
import { DebtGroup, StaticDB } from '@/data/staticDatabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function GroupScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<DebtGroup[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = () => {
    if (user) {
      setGroups(StaticDB.getUserGroups(user.id));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGroups();
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grup Hutang</Text>
          <Text style={styles.headerSubtitle}>
            Kelola hutang dalam grup dengan mudah
          </Text>
        </View>

        {/* Quick Action to View All Users Optimization */}
        <TouchableOpacity
          style={styles.optimizationCard}
          onPress={() => router.push('/all')}
        >
          <View style={styles.optimizationIcon}>
            <Text style={styles.optimizationEmoji}>🌐</Text>
          </View>
          <View style={styles.optimizationContent}>
            <Text style={styles.optimizationTitle}>Optimasi Semua User</Text>
            <Text style={styles.optimizationSubtitle}>
              Lihat optimasi hutang untuk semua user aplikasi
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Groups List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Grup Anda</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{groups.length} grup</Text>
            </View>
          </View>

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>Belum ada grup</Text>
              <Text style={styles.emptySubtext}>
                Buat grup untuk mengelola hutang bersama
              </Text>
            </View>
          ) : (
            groups.map(group => {
              const stats = StaticDB.getGroupStatistics(group.id);
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => router.push(`/group/${group.id}`)}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupIcon}>
                      <Text style={styles.groupEmoji}>👥</Text>
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      {group.description && (
                        <Text style={styles.groupDescription} numberOfLines={1}>
                          {group.description}
                        </Text>
                      )}
                    </View>
                    {group.creatorId === user.id && (
                      <View style={styles.creatorBadge}>
                        <Text style={styles.creatorText}>Creator</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.groupStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.memberCount}</Text>
                      <Text style={styles.statLabel}>Anggota</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.totalTransactions}</Text>
                      <Text style={styles.statLabel}>Transaksi</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.unpaidTransactions}</Text>
                      <Text style={styles.statLabel}>Belum Lunas</Text>
                    </View>
                  </View>

                  {stats.unpaidTransactions > 0 && (
                    <View style={styles.groupFooter}>
                      <Text style={styles.groupFooterText}>
                        💰 Total: {formatCurrency(stats.totalAmount)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Create Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => router.push('/group/create')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  optimizationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optimizationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optimizationEmoji: {
    fontSize: 24,
  },
  optimizationContent: {
    flex: 1,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optimizationSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#2563eb',
    marginLeft: 12,
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
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
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
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 13,
    color: '#666',
  },
  creatorBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  creatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  groupFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  groupFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
});
