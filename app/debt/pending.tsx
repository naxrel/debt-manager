import { useAuth } from '@/contexts/AuthContext';
import { StaticDB } from '@/data/staticDatabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PendingApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [pendingDebts, setPendingDebts] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingDebts();
  }, [user]);

  const loadPendingDebts = () => {
    if (!user) return;
    const pending = StaticDB.getPendingDebtsForUser(user.id);
    setPendingDebts(pending);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPendingDebts();
    setIsRefreshing(false);
  };

  const handleApprove = (debtId: string) => {
    if (!user) return;

    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Apakah Anda yakin menyetujui transaksi ini?');
      if (confirmed) {
        const result = StaticDB.approveDebt(debtId, user.id);
        if (result.success) {
          const remainingPending = StaticDB.getPendingDebtsForUser(user.id);
          if (remainingPending.length === 0) {
            alert('Transaksi berhasil di-approve');
            router.back();
          } else {
            alert('Transaksi berhasil di-approve');
            loadPendingDebts();
          }
        } else {
          alert(result.error || 'Gagal approve transaksi');
        }
      }
      return;
    }

    Alert.alert(
      'Konfirmasi Approve',
      'Apakah Anda yakin menyetujui transaksi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setuju',
          onPress: () => {
            const result = StaticDB.approveDebt(debtId, user.id);
            if (result.success) {
              const remainingPending = StaticDB.getPendingDebtsForUser(user.id);
              
              if (remainingPending.length === 0) {
                Alert.alert('Sukses', 'Transaksi berhasil di-approve', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } else {
                Alert.alert('Sukses', 'Transaksi berhasil di-approve');
                loadPendingDebts();
              }
            } else {
              Alert.alert('Error', result.error || 'Gagal approve transaksi');
            }
          },
        },
      ]
    );
  };

  const handleReject = (debtId: string) => {
    setSelectedDebtId(debtId);
    
    // Web handling
    if (Platform.OS === 'web') {
      const reason = window.prompt('Masukkan alasan penolakan:');
      if (reason && user) {
        const result = StaticDB.rejectDebt(debtId, user.id, reason);
        if (result.success) {
          const remainingPending = StaticDB.getPendingDebtsForUser(user.id);
          if (remainingPending.length === 0) {
            alert('Transaksi berhasil ditolak');
            router.back();
          } else {
            alert('Transaksi berhasil ditolak');
            loadPendingDebts();
          }
        } else {
          alert(result.error || 'Gagal reject transaksi');
        }
      }
      return;
    }
    
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Alasan Reject',
        'Masukkan alasan penolakan:',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: (reason?: string) => {
              if (!user || !reason) return;
              const result = StaticDB.rejectDebt(debtId, user.id, reason);
              if (result.success) {
                // Check if this is the last pending debt
                const remainingPending = StaticDB.getPendingDebtsForUser(user.id);
                
                if (remainingPending.length === 0) {
                  // Last one - show success and close
                  Alert.alert('Sukses', 'Transaksi berhasil ditolak', [
                    { text: 'OK', onPress: () => router.back() }
                  ]);
                } else {
                  // Still have more - just reload
                  Alert.alert('Sukses', 'Transaksi berhasil ditolak');
                  loadPendingDebts();
                }
              } else {
                Alert.alert('Error', result.error || 'Gagal reject transaksi');
              }
            },
          },
        ],
        'plain-text'
      );
    } else {
      // Android: Show custom modal
      Alert.alert(
        'Alasan Reject',
        'Silakan masukkan alasan penolakan di bawah transaksi, lalu tekan tombol Reject',
        [{ text: 'OK' }]
      );
    }
  };

  const confirmReject = (debtId: string) => {
    if (!user) return;
    
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Alasan reject harus diisi');
      return;
    }

    const result = StaticDB.rejectDebt(debtId, user.id, rejectReason);
    if (result.success) {
      // Check if this is the last pending debt
      const remainingPending = StaticDB.getPendingDebtsForUser(user.id);
      
      if (remainingPending.length === 0) {
        // Last one - show success and close
        Alert.alert('Sukses', 'Transaksi berhasil ditolak', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        // Still have more - just reload
        Alert.alert('Sukses', 'Transaksi berhasil ditolak');
        setRejectReason('');
        setSelectedDebtId(null);
        loadPendingDebts();
      }
    } else {
      Alert.alert('Error', result.error || 'Gagal reject transaksi');
    }
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

  const renderDebtItem = ({ item }: { item: any }) => {
    const initiator = StaticDB.getUserById(item.initiatedBy);
    const isRejectMode = selectedDebtId === item.id && Platform.OS === 'android';

    return (
      <View style={styles.debtCard}>
        <View style={styles.debtHeader}>
          <View>
            <Text style={styles.debtName}>
              {item.name} (@{initiator?.username})
            </Text>
            <Text style={styles.debtMeta}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.debtBadge}>
            <Text
              style={[
                styles.debtType,
                item.type === 'hutang' ? styles.hutangBadge : styles.piutangBadge,
              ]}
            >
              {item.type === 'hutang' ? 'Hutang' : 'Piutang'}
            </Text>
          </View>
        </View>

        <Text style={styles.debtAmount}>{formatCurrency(item.amount)}</Text>
        
        {item.description && (
          <Text style={styles.debtDescription}>{item.description}</Text>
        )}

        <View style={styles.debtInfo}>
          <Text style={styles.debtInfoLabel}>
            {item.type === 'hutang' 
              ? `📤 ${initiator?.name} mengatakan mereka berhutang ke Anda`
              : `📥 ${initiator?.name} mengatakan Anda berhutang ke mereka`}
          </Text>
        </View>

        {isRejectMode && (
          <View style={styles.rejectInputContainer}>
            <TextInput
              style={styles.rejectInput}
              placeholder="Alasan penolakan..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.approveButtonText}>✓ Approve</Text>
          </TouchableOpacity>

          {isRejectMode ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => confirmReject(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.rejectButtonText}>Konfirmasi Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setSelectedDebtId(null);
                  setRejectReason('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.rejectButtonText}>✗ Reject</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Persetujuan Pending</Text>
        <Text style={styles.headerSubtitle}>
          {pendingDebts.length} transaksi menunggu persetujuan Anda
        </Text>
      </View>

      <FlatList
        data={pendingDebts}
        renderItem={renderDebtItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Tidak ada transaksi pending</Text>
            <Text style={styles.emptySubtext}>
              Semua transaksi sudah di-approve atau reject
            </Text>
          </View>
        }
      />
    </View>
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
  backButton: {
    marginBottom: 16,
    cursor: 'pointer' as any,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
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
  listContainer: {
    padding: 16,
  },
  debtCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  debtName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  debtMeta: {
    fontSize: 13,
    color: '#999',
  },
  debtBadge: {
    alignItems: 'flex-end',
  },
  debtType: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  hutangBadge: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  piutangBadge: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  debtAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#344170',
    marginBottom: 8,
  },
  debtDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  debtInfo: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  debtInfoLabel: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  rejectInputContainer: {
    marginBottom: 12,
  },
  rejectInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
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
});
