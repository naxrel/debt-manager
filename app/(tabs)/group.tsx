import { Group, groupsApi } from '@/api';
import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
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
import Svg, { Circle, Path } from 'react-native-svg';

export default function GroupScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await groupsApi.getAll();
      setGroups(data);
      setFilteredGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadGroups();
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
        <Text style={styles.emptyText}>Make sure to register first</Text>
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
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle cx="11" cy="11" r="7" stroke="#33363F" strokeWidth="2" />
              <Path
                stroke="#33363F"
                strokeLinecap="round"
                strokeWidth="2"
                d="M11 8a3 3 0 0 0-3 3M20 20l-3-3"
              />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Find group..."
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
              {searchQuery ? (
                <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
                  <Circle cx="11" cy="11" r="7" stroke="#33363F" strokeWidth="2" />
                  <Path
                    stroke="#33363F"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="M11 8a3 3 0 0 0-3 3M20 20l-3-3"
                  />
                </Svg>
              ) : (
                <Text style={styles.emptyIcon}>👥</Text>
              )}
              <Text style={styles.emptyText}>
                {searchQuery ? 'Oops, there are no results' : 'No debts, pweasee T_T'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'or maybe just create a new one' : 'or create your debts with your friends now!'}
              </Text>
            </View>
          ) : (
            filteredGroups.map(group => {
              const memberCount = group._count?.members || group.members?.length || 0;
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => router.push(`/group/${group.id}`)}
                  activeOpacity={0.7}
                >
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
                    <View style={styles.groupNameRow}>
                      <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                      {group.creatorId === user?.userId && (
                        <View style={styles.creatorBadge}>
                          <Text style={styles.creatorText}>Creator</Text>
                        </View>
                      )}
                    </View>
                    {group.description && (
                      <Text style={styles.groupDescription} numberOfLines={1}>
                        {group.description}
                      </Text>
                    )}
                    <Text style={styles.groupMemberCount}>
                      {memberCount} member{memberCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Svg width={24} height={24} viewBox="0 0 1024 1024" fill="none">
                    <Path fill="#2563eb" d="M338.752 104.704a64 64 0 000 90.496l316.8 316.8-316.8 316.8a64 64 0 0090.496 90.496l362.048-362.048a64 64 0 000-90.496L429.248 104.704a64 64 0 00-90.496 0z" />
                  </Svg>
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
    backgroundColor: '#ffffffff',
    padding: 20,
    paddingTop: 45,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Font.bold,
    color: '#000000ff',
    marginTop: 10,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#000000ff',
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
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  groupImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupEmoji: {
    fontSize: 28,
    fontFamily: Font.regular,
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#333',
    flex: 1,
  },
  groupDescription: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#666',
    marginBottom: 4,
  },
  groupMemberCount: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#999',
  },
  creatorBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creatorText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#fff',
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
