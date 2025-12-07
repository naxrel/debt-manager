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

export default function DebtDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
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

  const handleMarkAsPaid = () => {
    if (!debt) return;

    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Apakah Anda yakin transaksi ini sudah lunas?');
      if (confirmed) {
        markAsPaid(debt.id);
        refreshDebts();
        alert('Transaksi ditandai sebagai lunas');
        router.back();
      }
      return;
    }

    Alert.alert(
      'Tandai Sebagai Lunas',
      'Apakah Anda yakin transaksi ini sudah lunas?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Lunas',
          onPress: () => {
            markAsPaid(debt.id);
            refreshDebts();
            Alert.alert('Sukses', 'Transaksi ditandai sebagai lunas', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!debt) return;

    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?');
      if (confirmed) {
        deleteDebt(debt.id);
        refreshDebts();
        alert('Transaksi berhasil dihapus');
        router.back();
      }
      return;
    }

    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteDebt(debt.id);
            refreshDebts();
            Alert.alert('Sukses', 'Transaksi berhasil dihapus', [
              { text: 'OK', onPress: () => router.back() },
            ]);
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
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Transaction</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* From/To Section */}
        <View style={styles.section}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.value}>{debt.type === 'hutang' ? debt.name : 'Me'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <Text style={styles.value}>{debt.type === 'piutang' ? debt.name : 'Me'}</Text>
        </View>

        {/* Date Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(debt.date)}, {new Date(debt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        {/* Note Section */}
        {debt.description && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Note:</Text>
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

        {/* Status Badge */}
        {debt.isPaid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>✓ LUNAS</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!debt.isPaid && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.rejectButton} 
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleMarkAsPaid}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
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
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    fontFamily: 'Biennale-Regular',
  },
  errorButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Biennale-SemiBold',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#111827',
    fontFamily: 'Biennale-Regular',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Biennale-SemiBold',
    color: '#111827',
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Biennale-Regular',
    color: '#9ca3af',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: 'Biennale-SemiBold',
    color: '#111827',
  },
  noteSection: {
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 14,
    fontFamily: 'Biennale-Regular',
    color: '#9ca3af',
    marginBottom: 8,
  },
  noteBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Biennale-Regular',
    color: '#111827',
    lineHeight: 22,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Biennale-SemiBold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: 'Biennale-Bold',
    color: '#111827',
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
    fontFamily: 'Biennale-Bold',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontFamily: 'Biennale-SemiBold',
    color: '#111827',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Biennale-SemiBold',
    color: '#111827',
  },
});
