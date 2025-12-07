import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DebtGroup, StaticDB } from '@/data/staticDatabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function GroupScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<DebtGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<DebtGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = () => {
    if (user) {
      const userGroups = StaticDB.getUserGroups(user.id);
      setGroups(userGroups);
      setFilteredGroups(userGroups);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGroups();
    setIsRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group =>
        group.name.toLowerCase().includes(text.toLowerCase()) ||
        group.description.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>deBT Group</Text>
          <Text style={styles.headerSubtitle}>
           Manage your money wisely!
          </Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search group..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')} activeOpacity={0.7}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Action to View All Users Optimization */}
        <TouchableOpacity
          style={styles.optimizationCard}
          onPress={() => router.push('/all')}
          activeOpacity={0.7}
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
            <Text style={styles.sectionTitle}>Your Group</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {searchQuery ? `${filteredGroups.length}/${groups.length}` : `${groups.length} grup`}
              </Text>
            </View>
          </View>

          {filteredGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {searchQuery ? '🔍' : '👥'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Grup tidak ditemukan' : 'Belum ada grup'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Coba kata kunci lain' : 'Buat grup untuk mengelola hutang bersama'}
              </Text>
            </View>
          ) : (
            filteredGroups.map(group => {
              const stats = StaticDB.getGroupStatistics(group.id);
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => router.push(`/group/${group.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupIcon}>
                      {group.groupImage ? (
                        <Image 
                          source={{ uri: group.groupImage }} 
                          style={styles.groupImage} 
                        />
                      ) : (
                        <Text style={styles.groupEmoji}>👥</Text>
                      )}
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
                        Total: {formatCurrency(stats.totalAmount)}
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
        activeOpacity={0.7}
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
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 45,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Font.bold,
    color: '#fff',
    marginTop: 10,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#e0e7ff',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchIcon: {
    fontSize: 12,
    fontFamily: Font.regular,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#333',
  },
  clearIcon: {
    fontSize: 18,
    fontFamily: Font.regular,
    color: '#999',
    paddingHorizontal: 8,
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
    cursor: 'pointer' as any,
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
    fontFamily: Font.regular,
  },
  optimizationContent: {
    flex: 1,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#333',
    marginBottom: 4,
  },
  optimizationSubtitle: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    fontFamily: Font.regular,
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
    fontFamily: 'Biennale-Bold',
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
    fontFamily: Font.semiBold,
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
    fontFamily: Font.regular,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#666',
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  groupImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  groupEmoji: {
    fontSize: 20,
    fontFamily: Font.regular,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#333',
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 12,
    fontFamily: Font.regular,
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
    fontFamily: Font.semiBold,
    color: '#fff',
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Biennale-Bold',
    color: '#2563eb',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Font.regular,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
  },
  groupFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  groupFooterText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#059669',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 110,
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
    cursor: 'pointer' as any,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Biennale-Bold',
  },
});
