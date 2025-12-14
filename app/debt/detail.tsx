import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { Debt, StaticDB } from '@/data/staticDatabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function DebtDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { markAsPaid, deleteDebt, refreshDebts } = useDebt();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const debtData = StaticDB.getDebtById(id);
      setDebt(debtData || null);
      setIsLoading(false);
    }
  }, [id]);

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
      month: 'long',
      year: 'numeric',
    });
  };

  // Fungsi untuk yang punya hutang request settlement
  const handleRequestSettlement = () => {
    if (!debt || !user) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Kirim permintaan pelunasan ke ' + debt.name + '?');
      if (confirmed) {
        const result = StaticDB.requestSettlement(debt.id, user.id);
        if (result.success) {
          refreshDebts();
          alert('Permintaan pelunasan berhasil dikirim');
          router.back();
        } else {
          alert(result.error || 'Gagal mengirim permintaan');
        }
      }
      return;
    }

    Alert.alert(
      'Kirim Permintaan Pelunasan',
      'Kirim permintaan pelunasan ke ' + debt.name + '?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kirim',
          onPress: () => {
            const result = StaticDB.requestSettlement(debt.id, user.id);
            if (result.success) {
              refreshDebts();
              Alert.alert('Sukses', 'Permintaan pelunasan berhasil dikirim', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Gagal mengirim permintaan');
            }
          },
        },
      ]
    );
  };

  // Fungsi untuk pemberi hutang approve settlement
  const handleApproveSettlement = () => {
    if (!debt || !user) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Setujui pelunasan dari ' + debt.name + '?');
      if (confirmed) {
        const result = StaticDB.approveSettlement(debt.id, user.id);
        if (result.success) {
          refreshDebts();
          alert('Pelunasan berhasil disetujui');
          router.back();
        } else {
          alert(result.error || 'Gagal menyetujui');
        }
      }
      return;
    }

    Alert.alert(
      'Setujui Pelunasan',
      'Setujui pelunasan dari ' + debt.name + '?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          onPress: () => {
            const result = StaticDB.approveSettlement(debt.id, user.id);
            if (result.success) {
              refreshDebts();
              Alert.alert('Sukses', 'Pelunasan berhasil disetujui', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Gagal menyetujui');
            }
          },
        },
      ]
    );
  };

  // Fungsi untuk reject settlement request (hanya ubah status, tidak delete debt)
  const handleRejectSettlement = () => {
    if (!debt || !user) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tolak permintaan pelunasan dari ' + debt.name + '?');
      if (confirmed) {
        const result = StaticDB.rejectSettlement(debt.id, user.id);
        if (result.success) {
          refreshDebts();
          alert('Permintaan pelunasan ditolak');
          router.back();
        } else {
          alert(result.error || 'Gagal menolak');
        }
      }
      return;
    }

    Alert.alert(
      'Tolak Pelunasan',
      'Tolak permintaan pelunasan dari ' + debt.name + '?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tolak',
          style: 'destructive',
          onPress: () => {
            const result = StaticDB.rejectSettlement(debt.id, user.id);
            if (result.success) {
              refreshDebts();
              Alert.alert('Sukses', 'Permintaan pelunasan ditolak', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Gagal menolak');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!debt) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Transaksi tidak ditemukan</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Transaksi</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Transaction Info Card */}
        <View style={styles.infoCard}>
          {/* From/To Section */}
          <View style={styles.infoItem}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.value}>{debt.type === 'hutang' ? debt.name : 'Me'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.value}>{debt.type === 'piutang' ? debt.name : 'Me'}</Text>
          </View>

          {/* Date Section */}
          <View style={styles.infoItem}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDate(debt.date)}, {new Date(debt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>

          {/* Note Section */}
          {debt.description && (
            <View style={styles.infoItem}>
              <Text style={styles.label}>Note</Text>
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>{debt.description}</Text>
              </View>
            </View>
          )}

          {/* Total Section */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(debt.amount)}</Text>
          </View>
        </View>

        {/* Status Badge */}
        {debt.isPaid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>✓ LUNAS</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!debt.isPaid && user && (
        <View style={styles.actionButtons}>
          {/* Jika user punya hutang (type='hutang'), hanya tampilkan Request Settlement */}
          {debt.type === 'hutang' && debt.status !== 'settlement_requested' && (
            <TouchableOpacity 
              style={[styles.confirmButton, styles.fullWidthButton]} 
              onPress={handleRequestSettlement}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Request Settlement</Text>
            </TouchableOpacity>
          )}

          {/* Jika sudah request settlement, tampilkan status pending */}
          {debt.type === 'hutang' && debt.status === 'settlement_requested' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Waiting approval from{debt.name}</Text>
            </View>
          )}

          {/* Jika user pemberi hutang (type='piutang') dan ada settlement request, tampilkan tombol Approve */}
          {debt.type === 'piutang' && debt.status === 'settlement_requested' && (
            <>
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={handleRejectSettlement}
                activeOpacity={0.8}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleApproveSettlement}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Approve Settlement</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Jika piutang tapi belum ada settlement request */}
          {debt.type === 'piutang' && debt.status !== 'settlement_requested' && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>Waiting {debt.name} to request settlement...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    fontFamily: Font.regular,
  },
  errorButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.semiBold,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 8,
    paddingTop: 50,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoItem: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#1f2937',
  },
  noteSection: {
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#9ca3af',
    marginBottom: 8,
  },
  noteBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#4b5563',
    lineHeight: 20,
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 20,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#6b7280',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontFamily: Font.bold,
    color: '#1f2937',
  },
  paidBadge: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  paidBadgeText: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#fff',
  },
  pendingBadge: {
    flex: 1,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  pendingBadgeText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#92400e',
    textAlign: 'center',
  },
  infoBadge: {
    flex: 1,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  infoBadgeText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#1e40af',
    textAlign: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
});
