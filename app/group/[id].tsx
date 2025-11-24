import { useAuth } from '@/contexts/AuthContext';
import { DebtGroup, GroupTransaction, StaticDB } from '@/data/staticDatabase';
import { DebtOptimizer, OptimizedDebt } from '@/utils/debtOptimizer';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<DebtGroup | null>(null);
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [optimizedDebts, setOptimizedDebts] = useState<OptimizedDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [addMemberError, setAddMemberError] = useState('');

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = () => {
    if (!id) return;

    const groupData = StaticDB.getGroupById(id);
    if (!groupData) {
      Alert.alert('Error', 'Grup tidak ditemukan', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    setGroup(groupData);
    const groupTransactions = StaticDB.getGroupTransactions(id);
    setTransactions(groupTransactions);

    // Calculate optimization for this group only
    const members = groupData.memberIds
      .map(memberId => StaticDB.getUserById(memberId))
      .filter(u => u !== undefined);

    // Calculate balances manually from group transactions
    const balanceMap = new Map<string, number>();
    
    // Initialize all members with 0 balance
    groupData.memberIds.forEach(memberId => {
      balanceMap.set(memberId, 0);
    });

    // Calculate net balance for each member
    groupTransactions.forEach(t => {
      // fromUser owes money (negative balance)
      const fromBalance = balanceMap.get(t.fromUserId) || 0;
      balanceMap.set(t.fromUserId, fromBalance - t.amount);
      
      // toUser is owed money (positive balance)
      const toBalance = balanceMap.get(t.toUserId) || 0;
      balanceMap.set(t.toUserId, toBalance + t.amount);
    });

    console.log('Balance Map:', Array.from(balanceMap.entries()));

    // Convert to UserBalance format
    const userBalances = members.map(member => ({
      userId: member.id,
      userName: member.name,
      balance: balanceMap.get(member.id) || 0,
    }));

    console.log('User Balances:', userBalances);

    // Optimize using the balance
    const optimizedDebts = DebtOptimizer.optimizeDebts(userBalances);
    
    console.log('Optimized Debts:', optimizedDebts);
    
    setOptimizedDebts(optimizedDebts);
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGroupData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddTransaction = () => {
    router.push(`/group/${id}/add-transaction`);
  };

  const openMembersDrawer = () => {
    setShowMembersDrawer(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMembersDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowMembersDrawer(false));
  };

  const handleDeleteGroup = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!group) return;

    if (deleteConfirmText.trim() === group.name) {
      setShowDeleteModal(false);
      executeDelete();
    } else {
      Alert.alert('Error', `Nama grup tidak sesuai. Ketik "${group.name}" dengan benar.`);
    }
  };

  const executeDelete = () => {
    if (!group) return;

    const result = StaticDB.deleteGroup(group.id);
    if (result.success) {
      Alert.alert('Berhasil', 'Grup berhasil dihapus', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Gagal menghapus grup');
    }
  };

  const handleAddMember = () => {
    if (!group || !newMemberUsername.trim()) {
      setAddMemberError('Masukkan username');
      return;
    }

    const foundUser = StaticDB.getUserByUsername(newMemberUsername.trim());
    
    if (!foundUser) {
      setAddMemberError(`Username "${newMemberUsername}" tidak ditemukan`);
      return;
    }

    if (group.memberIds.includes(foundUser.id)) {
      setAddMemberError('User sudah menjadi anggota grup');
      return;
    }

    const result = StaticDB.addMemberToGroup(group.id, foundUser.id);
    
    if (result.success) {
      setShowAddMemberModal(false);
      setNewMemberUsername('');
      setAddMemberError('');
      loadGroupData(); // Refresh
      Alert.alert('Berhasil', `${foundUser.name} berhasil ditambahkan ke grup`);
    } else {
      setAddMemberError(result.error || 'Gagal menambahkan anggota');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!group || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Data tidak ditemukan</Text>
      </View>
    );
  }

  const myOptimizedDebts = DebtOptimizer.getUserSuggestions(user.id, optimizedDebts);
  const stats = StaticDB.getGroupStatistics(group.id);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Kembali</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.membersButton}
              onPress={openMembersDrawer}
            >
              <Text style={styles.membersButtonText}>Anggota</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{group.name}</Text>
          {group.description && (
            <Text style={styles.headerSubtitle}>{group.description}</Text>
          )}
        </View>

        {/* Group Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.memberCount}</Text>
              <Text style={styles.statLabel}>Anggota</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalTransactions}</Text>
              <Text style={styles.statLabel}>Total Transaksi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{optimizedDebts.length}</Text>
              <Text style={styles.statLabel}>Simplifikasi</Text>
            </View>
          </View>
        </View>

        {/* My Actions in this Group */}
        {(myOptimizedDebts.shouldPay.length > 0 ||
          myOptimizedDebts.willReceive.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}></Text>

            {myOptimizedDebts.shouldPay.length > 0 && (
              <View style={styles.actionSection}>
                <Text style={styles.actionLabel}>Nominal yang harus dibayar:</Text>
                {myOptimizedDebts.shouldPay.map((debt, index) => (
                  <View key={index} style={[styles.debtCard, styles.payCard]}>
                    <View style={styles.debtHeader}>
                      <Text style={styles.debtName}>{debt.toName}</Text>
                      <Text style={styles.debtAmount}>
                        {formatCurrency(debt.amount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {myOptimizedDebts.willReceive.length > 0 && (
              <View style={styles.actionSection}>
                <Text style={styles.actionLabel}>Nominal yang diterima:</Text>
                {myOptimizedDebts.willReceive.map((debt, index) => (
                  <View
                    key={index}
                    style={[styles.debtCard, styles.receiveCard]}
                  >
                    <View style={styles.debtHeader}>
                      <Text style={styles.debtName}>{debt.fromName}</Text>
                      <Text style={styles.debtAmount}>
                        {formatCurrency(debt.amount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Simplified Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Simplifikasi Hutang</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{optimizedDebts.length} pembayaran</Text>
            </View>
          </View>

          {transactions.length > 0 && (
            <Text style={styles.simplificationNote}>
              💡 Dari {transactions.length} transaksi disederhanakan menjadi {optimizedDebts.length} pembayaran
            </Text>
          )}

          {optimizedDebts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>Tidak ada hutang</Text>
            </View>
          ) : (
            <View style={styles.simplificationList}>
              {optimizedDebts.map((debt, index) => (
                <View key={index} style={styles.simplificationItem}>
                  <View style={styles.simplificationRow}>
                    <Text style={styles.simplificationFromName}>{debt.fromName}</Text>
                    <Text style={styles.simplificationArrow}>→</Text>
                    <Text style={styles.simplificationToName}>{debt.toName}</Text>
                    <Text style={styles.simplificationEquals}>=</Text>
                    <Text style={styles.simplificationAmount}>
                      {formatCurrency(debt.amount).replace('Rp', '').trim()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* All Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Data Transaksi Raw</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{transactions.length} transaksi</Text>
            </View>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Belum ada transaksi</Text>
            </View>
          ) : (
            transactions.map(transaction => {
              const fromUser = StaticDB.getUserById(transaction.fromUserId);
              const toUser = StaticDB.getUserById(transaction.toUserId);
              const creator = StaticDB.getUserById(transaction.createdBy);
              return (
                <View
                  key={transaction.id}
                  style={styles.transactionCard}
                >
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionUsers}>
                      <Text style={styles.transactionFrom}>
                        {fromUser?.name}
                      </Text>
                      <Text style={styles.transactionArrow}>→</Text>
                      <Text style={styles.transactionTo}>{toUser?.name}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <View style={styles.transactionFooter}>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                    <Text style={styles.transactionCreator}>
                      Dibuat oleh: {creator?.name || 'Unknown'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Danger Zone - Only show to creator */}
        {user && group.creatorId === user.id && (
          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            <Text style={styles.dangerZoneDescription}>
              Menghapus grup akan menghapus semua transaksi di dalamnya
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteGroup}
            >
              <Text style={styles.deleteButtonText}>🗑️ Hapus Grup</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Members Slide-in Drawer */}
      <Modal
        visible={showMembersDrawer}
        transparent
        animationType="none"
        onRequestClose={closeMembersDrawer}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={closeMembersDrawer}
        >
          <Animated.View
            style={[
              styles.drawerContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Anggota Grup</Text>
                <TouchableOpacity onPress={closeMembersDrawer}>
                  <Text style={styles.drawerClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.drawerContent}
                contentContainerStyle={styles.drawerContentContainer}
                showsVerticalScrollIndicator={false}
              >
                {group?.memberIds.map(memberId => {
                  const member = StaticDB.getUserById(memberId);
                  if (!member) return null;
                  const isCreator = group.creatorId === memberId;
                  return (
                    <View key={memberId} style={styles.drawerMemberCard}>
                      <View style={styles.memberInfo}>
                        {member.profileImage ? (
                          <Image 
                            source={{ uri: member.profileImage }} 
                            style={styles.memberAvatar} 
                          />
                        ) : (
                          <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>
                              {member.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberUsername}>@{member.username}</Text>
                        </View>
                      </View>
                      {isCreator && (
                        <View style={styles.creatorBadge}>
                          <Text style={styles.creatorText}>Creator</Text>
                        </View>
                      )}
                      {memberId === user.id && !isCreator && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youText}>Anda</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Add Member Button - Only for creator */}
                {user && group.creatorId === user.id && (
                  <TouchableOpacity
                    style={styles.addMemberButton}
                    onPress={() => {
                      closeMembersDrawer();
                      setTimeout(() => setShowAddMemberModal(true), 300);
                    }}
                  >
                    <Text style={styles.addMemberButtonText}>+ Tambah Anggota</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Tambah Anggota</Text>
            
            <Text style={styles.deleteModalInstruction}>
              Masukkan username anggota yang ingin ditambahkan:
            </Text>

            <TextInput
              style={styles.deleteModalInput}
              value={newMemberUsername}
              onChangeText={(text) => {
                setNewMemberUsername(text);
                setAddMemberError('');
              }}
              placeholder="Contoh: john"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {addMemberError ? (
              <Text style={styles.errorText}>{addMemberError}</Text>
            ) : null}

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowAddMemberModal(false);
                  setNewMemberUsername('');
                  setAddMemberError('');
                }}
              >
                <Text style={styles.deleteModalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalConfirmButton, { backgroundColor: '#10b981' }]}
                onPress={handleAddMember}
              >
                <Text style={styles.deleteModalConfirmText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Delete Group</Text>
            
            <Text style={styles.deleteModalWarning}>
              ⚠️ This action cannot be undone. This will permanently delete the group and all its transactions.
            </Text>

            <Text style={styles.deleteModalInstruction}>
              To confirm, type "<Text style={styles.deleteModalGroupName}>{group?.name}</Text>" in the box below:
            </Text>

            <TextInput
              style={styles.deleteModalInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type group name here"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteModalConfirmButton,
                  deleteConfirmText.trim() !== group?.name && styles.deleteModalConfirmButtonDisabled
                ]}
                onPress={confirmDelete}
                disabled={deleteConfirmText.trim() !== group?.name}
              >
                <Text style={styles.deleteModalConfirmText}>Delete this group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Transaction Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleAddTransaction}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#344170',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  membersButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  membersButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  statsCard: {
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#344170',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#e8ebf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344170',
  },
  actionSection: {
    marginBottom: 16,
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
    marginBottom: 8,
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
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#344170',
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
  },
  simplificationList: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  simplificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  simplificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simplificationFromName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 80,
  },
  simplificationArrow: {
    fontSize: 18,
    color: '#54638d',
    fontWeight: 'bold',
  },
  simplificationToName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 80,
  },
  simplificationEquals: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  simplificationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    flex: 1,
    textAlign: 'right',
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  transactionPaid: {
    opacity: 0.6,
    borderLeftColor: '#10b981',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionFrom: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  transactionArrow: {
    fontSize: 16,
    color: '#999',
    marginHorizontal: 8,
  },
  transactionTo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#344170',
  },
  transactionAmountPaid: {
    color: '#10b981',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionCreator: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgePaid: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeUnpaid: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPaid: {
    color: '#059669',
  },
  statusTextUnpaid: {
    color: '#dc2626',
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#344170',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberUsername: {
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
  youBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  youText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  simplificationNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  drawerContainer: {
    width: 300,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#344170',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  drawerClose: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  drawerContent: {
    flex: 1,
  },
  drawerContentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  drawerMemberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#344170',
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
  dangerZone: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  dangerZoneDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteModalInstruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  deleteModalGroupName: {
    fontWeight: 'bold',
    color: '#333',
  },
  deleteModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  deleteModalConfirmButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalConfirmButtonDisabled: {
    backgroundColor: '#fca5a5',
    opacity: 0.5,
  },
  deleteModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  addMemberButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addMemberButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
  },
});
