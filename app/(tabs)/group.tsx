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
  View,
  Platform,
  StatusBar
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// --- DESIGN TOKENS ---
const COLORS = {
  background: '#FFFFFF', 
  surface: '#FFFFFF',
  primary: '#4F46E5',    
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',   
  textSec: '#64748B',    
  textTertiary: '#94A3B8',
  border: '#F1F5F9',     // Garis separator sangat halus
  inputBg: '#F8FAFC',    // Input abu-abu sangat muda
};

export default function GroupScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<DebtGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<DebtGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) loadGroups();
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

  if (!user) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* HEADER SECTION (Centered Title) */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} /> 
        <Text style={styles.headerTitle}>Groups</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* SEARCH BAR (Added Top Spacing) */}
      <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
               <Circle cx="11" cy="11" r="8" stroke={COLORS.textTertiary} strokeWidth="2" />
               <Path d="M21 21L16.65 16.65" stroke={COLORS.textTertiary} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
                <View style={styles.clearIconBg}>
                    <Text style={styles.clearIcon}>✕</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            colors={[COLORS.primary]} 
            tintColor={COLORS.primary}
          />
        }
      >
        {/* LIST SECTION */}
        <View style={styles.listSection}>
          {filteredGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No groups found' : 'Start your debt journey now!'}
              </Text>
            </View>
          ) : (
            filteredGroups.map((group, index) => {
              const stats = StaticDB.getGroupStatistics(group.id);
              const isLastItem = index === filteredGroups.length - 1;

              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.listItemContainer}
                  onPress={() => router.push(`/group/${group.id}`)}
                  activeOpacity={0.7}
                >
                  {/* Content Wrapper */}
                  <View style={styles.listItemContent}>
                    {/* Avatar: Circle */}
                    <View style={styles.avatarContainer}>
                      {group.groupImage ? (
                        <Image source={{ uri: group.groupImage }} style={styles.avatarImage} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.primarySoft }]}>
                          <Text style={styles.avatarEmoji}></Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Text Info */}
                    <View style={styles.textContainer}>
                      <View style={styles.itemTopRow}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{group.name}</Text>
                          <Text style={styles.itemTime}>{stats.memberCount} Mbrs</Text>
                      </View>
                      
                      <View style={styles.itemBottomRow}>
                          <Text style={styles.itemSubtitle} numberOfLines={1}>
                            {group.description || 'No description'}
                          </Text>
                      </View>
                    </View>
                  </View>

                  {/* SEPARATOR LINE (Only show if not last item) */}
                  {/* Logika: Hanya garisnya yang di-indent, bukan seluruh konten */}
                  {!isLastItem && <View style={styles.separator} />}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB BUTTON */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => router.push('/group/create')}
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
    backgroundColor: COLORS.background 
  },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    backgroundColor: COLORS.background,
    // Tidak ada paddingBottom di sini, jarak diatur oleh margin Search Bar
  },
  headerSpacer: { width: 40 },
  headerTitle: {
    fontSize: 24, 
    fontFamily: Font.bold,
    color: COLORS.textMain,
    textAlign: 'center',
    flex: 1,
  },

  // --- SEARCH BAR (Fixed Spacing) ---
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 30, // Memberikan jarak dari Header "Groups"
    marginBottom: 4, 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    height: 44, 
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontFamily: Font.regular,
    color: COLORS.textMain,
    height: '100%',
  },
  clearBtn: { padding: 4 },
  clearIconBg: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.textTertiary, justifyContent: 'center', alignItems: 'center'
  },
  clearIcon: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },

  // --- LIST AREA ---
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  listSection: { paddingHorizontal: 0 }, 

  // --- LIST ITEM STYLING (Fixed Layout) ---
  listItemContainer: {
    // Container utama tidak boleh punya padding/margin yang aneh
    backgroundColor: 'transparent',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 16, // Padding standar kiri-kanan
  },
  
  // Avatar
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26, // Lingkaran Penuh
    backgroundColor: COLORS.inputBg,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
    color: COLORS.primary,
  },

  // Texts
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
    flex: 1,
    marginRight: 8,
  },
  itemTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: Font.regular,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSubtitle: {
    fontSize: 14,
    color: COLORS.textSec, 
    fontFamily: Font.regular,
    flex: 1,
    marginRight: 16,
  },
  
  // SEPARATOR LINE
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    // Indentasi: Padding (16) + Avatar (52) + Jarak Avatar (16) = 84
    marginLeft: 84, 
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
  },

  // FAB
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28, 
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});