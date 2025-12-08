import { BottomLeftArrow, RightArrow, TopRightArrow } from '@/components/ArrowIcons';
import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DebtGroup, GroupTransaction, StaticDB } from '@/data/staticDatabase';
import { DebtOptimizer, OptimizedDebt } from '@/utils/debtOptimizer';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupImage, setEditGroupImage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<OptimizedDebt | null>(null);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAmount, setCelebrationAmount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // Auto refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [id])
  );

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = () => {
    if (!id || !user) return;

    const groupData = StaticDB.getGroupById(id);
    if (!groupData) {
      Alert.alert('Error', 'Grup tidak ditemukan', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    setGroup(groupData);
    
    // Load pending settlement requests for current user
    const pending = StaticDB.getPendingSettlementRequests(user.id, id);
    setPendingRequests(pending);
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

    // Calculate net balance for each member (only unpaid transactions)
    const unpaidTransactions = groupTransactions.filter(t => !t.isPaid);
    console.log('Total Transactions:', groupTransactions.length);
    console.log('Unpaid Transactions:', unpaidTransactions.length);
    console.log('Unpaid Details:', unpaidTransactions.map(t => ({
      from: StaticDB.getUserById(t.fromUserId)?.name,
      to: StaticDB.getUserById(t.toUserId)?.name,
      amount: t.amount,
      isPaid: t.isPaid
    })));
    
    unpaidTransactions.forEach(t => {
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

  const handlePickGroupImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Akses ke galeri diperlukan untuk mengganti foto grup');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEditGroupImage(result.assets[0].uri);
    }
  };

  const handleSaveGroupEdit = () => {
    if (!group || !editGroupName.trim()) {
      if (Platform.OS === 'web') {
        alert('Nama grup tidak boleh kosong');
      } else {
        Alert.alert('Error', 'Nama grup tidak boleh kosong');
      }
      return;
    }

    const result = StaticDB.updateGroup(group.id, {
      name: editGroupName.trim(),
      description: editGroupDescription.trim(),
      groupImage: editGroupImage || undefined,
    });

    if (result.success) {
      setShowEditModal(false);
      loadGroupData();
      if (Platform.OS === 'web') {
        alert('Grup berhasil diperbarui');
      } else {
        Alert.alert('Berhasil', 'Grup berhasil diperbarui');
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Gagal memperbarui grup');
      } else {
        Alert.alert('Error', result.error || 'Gagal memperbarui grup');
      }
    }
  };

  const handlePayDebt = (debt: OptimizedDebt) => {
    setSelectedDebt(debt);
    setPaymentDescription(`Settlement: ${debt.fromName} → ${debt.toName}`);
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    if (!selectedDebt || !group || !user) return;

    // Create settlement request instead of direct transaction
    const result = StaticDB.createSettlementRequest(
      group.id,
      selectedDebt.from,
      selectedDebt.to,
      selectedDebt.amount,
      paymentDescription.trim() || `Settlement: ${selectedDebt.fromName} → ${selectedDebt.toName}`
    );

    if (result.success) {
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentDescription('');
      loadGroupData();
      
      if (Platform.OS === 'web') {
        alert('Request pelunasan berhasil dikirim! Menunggu approval dari penerima. ⏳');
      } else {
        Alert.alert('Berhasil', 'Request pelunasan berhasil dikirim! Menunggu approval dari penerima. ⏳');
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Gagal mengirim request');
      } else {
        Alert.alert('Error', result.error || 'Gagal mengirim request');
      }
    }
  };

  const handleApproveSettlement = (requestId: string, amount: number) => {
    if (!user) return;

    console.log('Approving settlement request:', requestId);
    const result = StaticDB.approveSettlementRequest(requestId, user.id);
    console.log('Approval result:', result);

    if (result.success) {
      // Show celebration first
      setCelebrationAmount(amount);
      setShowCelebration(true);
      
      // Reload data immediately to update optimized debts (remove settled amount)
      setTimeout(() => {
        console.log('Reloading group data after approval...');
        loadGroupData();
      }, 100);
      
      // Hide celebration after 3 seconds and reload again to ensure sync
      setTimeout(() => {
        setShowCelebration(false);
        console.log('Final reload after celebration...');
        loadGroupData();
      }, 3000);
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Gagal approve request');
      } else {
        Alert.alert('Error', result.error || 'Gagal approve request');
      }
    }
  };

  const handleRejectSettlement = (requestId: string) => {
    if (!user) return;

    // Web compatibility
    if (Platform.OS === 'web') {
      const reason = window.prompt('Alasan reject (opsional):');
      if (reason === null) return; // User clicked cancel
      
      const result = StaticDB.rejectSettlementRequest(
        requestId,
        user.id,
        reason || 'Tidak ada alasan'
      );

      if (result.success) {
        loadGroupData();
        alert('Request ditolak');
      } else {
        alert(result.error || 'Gagal reject request');
      }
      return;
    }

    // Mobile (iOS/Android)
    Alert.prompt(
      'Reject Settlement',
      'Alasan reject (opsional):',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: (reason?: string) => {
            const result = StaticDB.rejectSettlementRequest(
              requestId,
              user.id,
              reason || 'Tidak ada alasan'
            );

            if (result.success) {
              loadGroupData();
              Alert.alert('Berhasil', 'Request ditolak');
            } else {
              Alert.alert('Error', result.error || 'Gagal reject request');
            }
          },
        },
      ],
      'plain-text'
    );
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

  // Celebration Modal Component
  const CelebrationModal = () => (
    <Modal
      visible={showCelebration}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCelebration(false)}
    >
      <View style={styles.celebrationOverlay}>
        <View style={styles.celebrationCard}>
          <Text style={styles.celebrationTitle}>🎉 Pelunasan Disetujui! 🎉</Text>
          <Text style={styles.celebrationAmount}>
            {formatCurrency(celebrationAmount)}
          </Text>
          <Text style={styles.celebrationMessage}>
            Hutang telah dilunasi dan dicatat!
          </Text>
          
          {/* Simple bar graph */}
          <View style={styles.graphContainer}>
            <View style={styles.graphBar}>
              <View 
                style={[
                  styles.graphFill,
                  { width: '100%' }
                ]}
              />
            </View>
            <Text style={styles.graphLabel}>Nominal Pelunasan</Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <CelebrationModal />
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
              activeOpacity={0.7}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
              </Svg>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              {user && group.creatorId === user.id ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditGroupName(group.name);
                    setEditGroupDescription(group.description);
                    setEditGroupImage(group.groupImage || null);
                    setShowEditModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editButtonText}>⚙️</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.membersButton}
                onPress={openMembersDrawer}
                activeOpacity={0.7}
              >
                <Text style={styles.membersButtonText}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.groupImageContainer}>
              {group.groupImage ? (
                <Image 
                  source={{ uri: group.groupImage }} 
                  style={styles.groupImageLarge} 
                />
              ) : (
                <View style={styles.groupImagePlaceholder}>
                  <Text style={styles.groupEmojiLarge}>👥</Text>
                </View>
              )}
            </View>
            <View style={styles.headerTextContent}>
              <Text style={styles.headerTitle}>{group.name}</Text>
              {group.description ? (
                <Text style={styles.headerSubtitle}>{group.description}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Group Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.memberCount}</Text>
              <Text style={styles.statLabel}>Member</Text>
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

        {/* Pending Settlement Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.settlementRequestHeader}>
              <Text style={styles.sectionTitle}>⏳ Pending Approval</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingRequests.length}</Text>
              </View>
            </View>
            {pendingRequests.map((request) => {
              const fromUser = StaticDB.getUserById(request.fromUserId);
              return (
                <View key={request.id} style={styles.settlementRequestCard}>
                  <View style={styles.settlementRequestInfo}>
                    <Text style={styles.settlementRequestTitle}>
                      💸 {fromUser?.name} ingin melunasi
                    </Text>
                    <Text style={styles.settlementRequestAmount}>
                      {formatCurrency(request.amount)}
                    </Text>
                    <Text style={styles.settlementRequestDescription}>
                      {request.description}
                    </Text>
                    <Text style={styles.settlementRequestDate}>
                      {new Date(request.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.settlementRequestActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApproveSettlement(request.id, request.amount)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.approveButtonText}>✓ Terima</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectSettlement(request.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rejectButtonText}>✕ Tolak</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* My Actions in this Group */}
        {(myOptimizedDebts.shouldPay.length > 0 ||
          myOptimizedDebts.willReceive.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}></Text>

            {myOptimizedDebts.shouldPay.length > 0 ? (
              <View style={styles.actionSection}>
                <Text style={styles.actionLabel}>Nominal yang harus dibayar:</Text>
                {myOptimizedDebts.shouldPay.map((debt, index) => (
                  <View key={index} style={[styles.debtCard, styles.payCard]}>
                    <View style={styles.debtHeader}>
                      <View style={styles.debtInfo}>
                        <Text style={styles.debtName}>{debt.toName}</Text>
                        <Text style={styles.debtAmount}>
                          {formatCurrency(debt.amount)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handlePayDebt(debt)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.payButtonText}>💸 Bayar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {myOptimizedDebts.willReceive.length > 0 ? (
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
            ) : null}
          </View>
        ) : null}

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
              <Text style={styles.emptyText}>No debt yet, start now!</Text>
            </View>
          ) : (
            <View style={styles.simplificationList}>
              {optimizedDebts.map((debt, index) => {
                const isUserInvolved = user && (debt.from === user.id || debt.to === user.id);
                const canUserPay = user && debt.from === user.id;
                
                return (
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
                );
              })}
            </View>
          )}
        </View>

        {/* All Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{transactions.length} transcation</Text>
            </View>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Start your transaction!</Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction, index, sortedTransactions) => {
                const fromUser = StaticDB.getUserById(transaction.fromUserId);
                const toUser = StaticDB.getUserById(transaction.toUserId);
                const creator = StaticDB.getUserById(transaction.createdBy);
                
                // Group by date (only date part, not time)
                const currentDate = transaction.date.split('T')[0];
                const previousDate = index > 0 ? sortedTransactions[index - 1].date.split('T')[0] : null;
                const showDateHeader = currentDate !== previousDate;

                // Format date: "Today", "Yesterday", "Aug 8" or "Jun 9, 2025"
                const formatDateHeader = (dateString: string) => {
                  const date = new Date(dateString);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dateOnly = new Date(date);
                  dateOnly.setHours(0, 0, 0, 0);
                  
                  const diffTime = today.getTime() - dateOnly.getTime();
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays === 0) return 'Today';
                  if (diffDays === 1) return 'Yesterday';
                  
                  const showYear = date.getFullYear() !== today.getFullYear();
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const month = monthNames[date.getMonth()];
                  const day = date.getDate();
                  const year = date.getFullYear();
                  
                  return showYear ? `${month} ${day}, ${year}` : `${month} ${day}`;
                };

                // Determine transaction type for current user
                const isUserOwes = user && transaction.fromUserId === user.id; // User berhutang (merah) - bottom left arrow
                const isUserReceives = user && transaction.toUserId === user.id; // User menerima (hijau) - top right arrow
                const isOthersTransaction = user && transaction.fromUserId !== user.id && transaction.toUserId !== user.id; // Hutang orang lain (kuning) - right arrow

                // Set icon style and arrow direction based on transaction type
                const iconBackgroundColor = isUserOwes ? '#fee2e2' : isUserReceives ? '#d1fae5' : '#fef3c7';
                const iconColor = isUserOwes ? '#dc2626' : isUserReceives ? '#10b981' : '#f59e0b';

                // Select appropriate arrow component
                const ArrowComponent = isUserOwes ? BottomLeftArrow : isUserReceives ? TopRightArrow : RightArrow;

                return (
                  <View key={transaction.id}>
                    {showDateHeader ? (
                      <Text style={styles.transactionDateHeader}>{formatDateHeader(currentDate)}</Text>
                    ) : null}
                    <TouchableOpacity 
                      style={styles.transactionListItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionIconContainer}>
                        <View style={[
                          isOthersTransaction ? styles.transactionIcon : 
                          isUserOwes ? styles.transactionIconOwes : 
                          styles.transactionIconReceives,
                          { backgroundColor: iconBackgroundColor }
                        ]}>
                          <ArrowComponent color={iconColor} size={20} />
                        </View>
                      </View>
                      <View style={styles.transactionListContent}>
                        <View style={styles.transactionListLeft}>
                          <Text style={styles.transactionListAmount}>
                            {formatCurrency(transaction.amount)}
                          </Text>
                          <Text style={styles.transactionListUsers}>
                            {fromUser?.name || 'Unknown'} → {toUser?.name || 'Unknown'}
                          </Text>
                          {transaction.description ? (
                            <Text style={styles.transactionListDescription}>
                              {transaction.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

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
                <Text style={styles.drawerTitle}>Member List</Text>
                <TouchableOpacity onPress={closeMembersDrawer}>
                  <Text style={styles.drawerClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.drawerContent}
                contentContainerStyle={styles.drawerContentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Creator Section */}
                {(() => {
                  const creator = StaticDB.getUserById(group.creatorId);
                  if (!creator) return null;
                  return (
                    <View>
                      <View style={styles.roleHeader}>
                        <Text style={styles.roleTitle}>CREATOR — 1</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.memberItem}
                        activeOpacity={0.7}
                      >
                        <View style={styles.memberAvatarContainer}>
                          {creator.profileImage ? (
                            <Image 
                              source={{ uri: creator.profileImage }} 
                              style={styles.memberAvatar} 
                            />
                          ) : (
                            <View style={styles.memberAvatar}>
                              <Text style={styles.memberAvatarText}>
                                {creator.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.memberTextContainer}>
                          <Text style={styles.memberName}>
                            {creator.name}
                            {creator.id === user.id && (
                              <Text style={styles.youIndicator}> (You)</Text>
                            )}
                          </Text>
                          <Text style={styles.memberUsername}>@{creator.username}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })()}

                {/* Members Section */}
                {(() => {
                  const members = group?.memberIds
                    .filter(id => id !== group.creatorId)
                    .map(id => StaticDB.getUserById(id))
                    .filter(m => m !== undefined);
                  
                  if (!members || members.length === 0) return null;
                  
                  return (
                    <View style={styles.roleSection}>
                      <View style={styles.roleHeader}>
                        <Text style={styles.roleTitle}>MEMBERS — {members.length}</Text>
                      </View>
                      {members.map(member => (
                        <TouchableOpacity 
                          key={member.id}
                          style={styles.memberItem}
                          activeOpacity={0.7}
                        >
                          <View style={styles.memberAvatarContainer}>
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
                          </View>
                          <View style={styles.memberTextContainer}>
                            <Text style={styles.memberName}>
                              {member.name}
                              {member.id === user.id && (
                                <Text style={styles.youIndicator}> (You)</Text>
                              )}
                            </Text>
                            <Text style={styles.memberUsername}>@{member.username}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}

                {/* Add Member Button - Only for creator */}
                {user && group.creatorId === user.id ? (
                  <TouchableOpacity
                    style={styles.addMemberButton}
                    onPress={() => {
                      closeMembersDrawer();
                      setTimeout(() => setShowAddMemberModal(true), 300);
                    }}
                  >
                    <Text style={styles.addMemberButtonText}>+ Invite to Group</Text>
                  </TouchableOpacity>
                ) : null}
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

      {/* Edit Group Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity 
          style={styles.deleteModalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <ScrollView 
              contentContainerStyle={styles.editModalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.editModalContainer}>
            <Text style={styles.deleteModalTitle}>Edit Grup</Text>
            
            {/* Group Image */}
            <TouchableOpacity
              style={styles.editImageContainer}
              onPress={handlePickGroupImage}
              activeOpacity={0.7}
            >
              {editGroupImage ? (
                <Image source={{ uri: editGroupImage }} style={styles.editGroupImage} />
              ) : (
                <View style={styles.editImagePlaceholder}>
                  <Text style={styles.editPlaceholderEmoji}>👥</Text>
                  <Text style={styles.editPlaceholderText}>Tap untuk ubah foto</Text>
                </View>
              )}
            </TouchableOpacity>

            {editGroupImage ? (
              <TouchableOpacity
                onPress={() => setEditGroupImage(null)}
                style={styles.removeEditImageButton}
                activeOpacity={0.7}
              >
                <Text style={styles.removeEditImageText}>Delete</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.editModalLabel}>Nama Grup</Text>
            <TextInput
              style={styles.deleteModalInput}
              value={editGroupName}
              onChangeText={setEditGroupName}
              placeholder="Nama grup"
              placeholderTextColor="#999"
            />

            <Text style={styles.editModalLabel}>Deskripsi</Text>
            <TextInput
              style={[styles.deleteModalInput, styles.editModalTextArea]}
              value={editGroupDescription}
              onChangeText={setEditGroupDescription}
              placeholder="Deskripsi grup (opsional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalConfirmButton, { backgroundColor: '#2563eb' }]}
                onPress={handleSaveGroupEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalConfirmText}>Simpan</Text>
              </TouchableOpacity>
            </View>

            {/* Danger Zone - Delete Group */}
            <View style={styles.editDangerZone}>
              <Text style={styles.editDangerZoneTitle}>Danger Zone</Text>
              <Text style={styles.editDangerZoneDescription}>
                Menghapus grup akan menghapus semua transaksi di dalamnya
              </Text>
              <TouchableOpacity
                style={styles.editDeleteButton}
                onPress={() => {
                  setShowEditModal(false);
                  setTimeout(() => handleDeleteGroup(), 300);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.editDeleteButtonText}>🗑️ Hapus Grup</Text>
              </TouchableOpacity>
            </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
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

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>💸 Konfirmasi Pembayaran</Text>
            
            {selectedDebt && (
              <>
                <View style={styles.paymentSummary}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Dari:</Text>
                    <Text style={styles.paymentValue}>{selectedDebt.fromName}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Kepada:</Text>
                    <Text style={styles.paymentValue}>{selectedDebt.toName}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Jumlah:</Text>
                    <Text style={[styles.paymentValue, styles.paymentAmount]}>
                      {formatCurrency(selectedDebt.amount)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.editModalLabel}>Catatan (opsional):</Text>
                <TextInput
                  style={styles.deleteModalInput}
                  value={paymentDescription}
                  onChangeText={setPaymentDescription}
                  placeholder="Contoh: Transfer BCA, Tunai, dll"
                  placeholderTextColor="#999"
                  multiline
                />

                <Text style={styles.paymentNote}>
                  ℹ️ Pembayaran ini akan dicatat sebagai transaksi settlement dan akan menyeimbangkan hutang yang ada.
                </Text>
              </>
            )}

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowPaymentModal(false);
                  setSelectedDebt(null);
                  setPaymentDescription('');
                }}
              >
                <Text style={styles.deleteModalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalConfirmButton, { backgroundColor: '#10b981' }]}
                onPress={confirmPayment}
              >
                <Text style={styles.deleteModalConfirmText}>✓ Konfirmasi</Text>
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
    paddingTop: 35,
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

  membersButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  membersButtonText: {
    color: '#fff',
    fontSize: 14,
     
    fontFamily: 'Biennale-SemiBold',
  },
  headerTitle: {
    fontSize: 28,
     
    color: '#fff',
    marginBottom: 8,
    fontFamily: Font.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    fontFamily: 'Biennale-Regular',
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
    color: '#344170',
    marginBottom: 4,
    fontFamily: Font.bold,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: Font.regular,
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
    color: '#333',
    fontFamily: Font.bold,
  },
  badge: {
    backgroundColor: '#e8ebf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#344170',
    fontFamily: Font.semiBold,
  },
  actionSection: {
    marginBottom: 16,
  },
  actionLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontFamily: Font.semiBold,
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
    gap: 12,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
     
    color: '#333',
    fontFamily: 'Biennale-SemiBold',
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 18,
     
    color: '#344170',
    fontFamily: Font.bold,
  },
  payButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Font.semiBold,
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
    fontFamily: Font.regular,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    fontFamily: Font.semiBold,
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
    marginBottom: 8,
  },
  quickPayButton: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
    alignSelf: 'flex-start',
  },
  quickPayButtonText: {
    color: '#10b981',
    fontSize: 13,
    fontFamily: Font.semiBold,
  },
  simplificationFromName: {
    fontSize: 16,
    color: '#333',
    minWidth: 80,
    fontFamily: Font.semiBold,
  },
  simplificationArrow: {
    fontSize: 18,
    color: '#54638d',
    fontFamily: Font.bold,
  },
  simplificationToName: {
    fontSize: 16,
    color: '#333',
    minWidth: 80,
    fontFamily: Font.semiBold,
  },
  simplificationEquals: {
    fontSize: 18,
    color: '#666',
    fontFamily: Font.bold,
  },
  simplificationAmount: {
    fontSize: 18,
    color: '#10b981',
    flex: 1,
    textAlign: 'right',
    fontFamily: Font.bold,
  },
  transactionList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionDateHeader: {
    fontSize: 13,
     
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    fontFamily: 'Biennale-SemiBold',
  },
  transactionListItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionIconContainer: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 3,
    paddingLeft: 0,
  },
  transactionIconOwes: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
    paddingLeft: 4,
  },
  transactionIconReceives: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    paddingRight: 4,
  },
  transactionIconText: {
    fontSize: 18,
    color: '#10b981',
     
    fontFamily: Font.bold,
  },
  transactionListContent: {
    flex: 1,
  },
  transactionListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionListLeft: {
    flex: 1,
  },
  transactionListAmount: {
    fontSize: 16,
     
    color: '#333',
    marginBottom: 2,
    fontFamily: Font.bold,
  },
  transactionListUsers: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Biennale-Regular',
  },
  transactionListDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Biennale-Regular',
  },
  transactionListRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  transactionListTime: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'Biennale-Regular',
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
     
    fontFamily: 'Biennale-SemiBold',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#344170',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Font.semiBold,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: Font.semiBold,
    marginBottom: 2,
  },
  memberUsername: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: Font.regular,
  },
  youIndicator: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6b7280',
    fontFamily: Font.regular,
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
    fontFamily: Font.semiBold,
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
    fontFamily: Font.semiBold,
  },
  simplificationNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Biennale-Regular',
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
    backgroundColor: '#000000ff',
  },
  drawerTitle: {
    fontSize: 20,
    color: '#C3D1E6',
    fontFamily: Font.bold,
  },
  drawerClose: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    fontFamily: Font.regular,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  drawerContentContainer: {
    paddingVertical: 16,
    paddingBottom: 80,
  },
  roleSection: {
    marginTop: 20,
  },
  roleHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  roleTitle: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Font.semiBold,
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  memberAvatarContainer: {
    marginRight: 12,
  },
  memberTextContainer: {
    flex: 1,
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
    fontFamily: Font.bold,
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
     
    color: '#dc2626',
    marginBottom: 8,
    fontFamily: Font.bold,
  },
  dangerZoneDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Biennale-Regular',
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
     
    color: '#fff',
    fontFamily: 'Biennale-SemiBold',
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
     
    color: '#333',
    marginBottom: 16,
    justifyContent: 'center',
    fontFamily: Font.bold,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: 'Biennale-Regular',
  },
  deleteModalInstruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'Biennale-Regular',
  },
  deleteModalGroupName: {
     
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
    fontFamily: 'Biennale-Regular',
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
     
    color: '#666',
    fontFamily: 'Biennale-SemiBold',
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
     
    color: '#fff',
    fontFamily: 'Biennale-SemiBold',
  },
  addMemberButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addMemberButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: Font.semiBold,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
    fontFamily: 'Biennale-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
     
    fontFamily: 'Biennale-SemiBold',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  groupImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  groupImageLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  groupImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupEmojiLarge: {
    fontSize: 32,
    fontFamily: 'Biennale-Regular',
  },
  headerTextContent: {
    flex: 1,
  },
  editModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  editModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  editImageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  editGroupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  editPlaceholderEmoji: {
    fontSize: 40,
    marginBottom: 4,
    fontFamily: 'Biennale-Regular',
  },
  editPlaceholderText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Biennale-Regular',
  },
  removeEditImageButton: {
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    alignSelf: 'center',
  },
  removeEditImageText: {
    color: '#dc2626',
    fontSize: 13,
     
    fontFamily: 'Biennale-SemiBold',
  },
  editModalLabel: {
    fontSize: 14,
     
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
    fontFamily: 'Biennale-SemiBold',
  },
  editModalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editDangerZone: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  editDangerZoneTitle: {
    fontSize: 16,
     
    color: '#dc2626',
    marginBottom: 8,
    fontFamily: 'Biennale-Bold',
  },
  editDangerZoneDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Biennale-Regular',
  },
  editDeleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editDeleteButtonText: {
    fontSize: 15,
     
    color: '#fff',
    fontFamily: 'Biennale-SemiBold',
  },
  paymentSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: Font.regular,
  },
  paymentValue: {
    fontSize: 15,
    color: '#333',
    fontFamily: Font.semiBold,
  },
  paymentAmount: {
    fontSize: 18,
    color: '#10b981',
    fontFamily: Font.bold,
  },
  paymentNote: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 18,
    fontFamily: Font.regular,
  },
  // Settlement Request Styles
  settlementRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  pendingBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Font.bold,
  },
  settlementRequestCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
    padding: 16,
    marginBottom: 12,
  },
  settlementRequestInfo: {
    marginBottom: 12,
  },
  settlementRequestTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: Font.semiBold,
    marginBottom: 4,
  },
  settlementRequestAmount: {
    fontSize: 24,
    color: '#10b981',
    fontFamily: Font.bold,
    marginBottom: 4,
  },
  settlementRequestDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: Font.regular,
    marginBottom: 4,
  },
  settlementRequestDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: Font.regular,
  },
  settlementRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Font.semiBold,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Font.semiBold,
  },
  // Celebration Modal Styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  celebrationTitle: {
    fontSize: 24,
    color: '#333',
    fontFamily: Font.bold,
    marginBottom: 16,
    textAlign: 'center',
  },
  celebrationAmount: {
    fontSize: 36,
    color: '#10b981',
    fontFamily: Font.bold,
    marginBottom: 8,
  },
  celebrationMessage: {
    fontSize: 16,
    color: '#666',
    fontFamily: Font.regular,
    marginBottom: 24,
    textAlign: 'center',
  },
  graphContainer: {
    width: '100%',
    marginTop: 16,
  },
  graphBar: {
    height: 40,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  graphFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  graphLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: Font.semiBold,
    textAlign: 'center',
  },
});
