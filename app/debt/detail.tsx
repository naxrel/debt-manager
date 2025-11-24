import { useDebt } from '@/contexts/DebtContext';
import { Debt, StaticDB } from '@/data/staticDatabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.badge, debt.type === 'hutang' ? styles.hutangBadge : styles.piutangBadge]}>
          <Text style={styles.badgeText}>
            {debt.type === 'hutang' ? 'Hutang' : 'Piutang'}
          </Text>
        </View>

        <Text style={styles.name}>{debt.name}</Text>
        <Text style={styles.amount}>{formatCurrency(debt.amount)}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>{formatDate(debt.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.statusBadge, debt.isPaid ? styles.paidStatus : styles.unpaidStatus]}>
              {debt.isPaid ? 'Lunas' : 'Belum Lunas'}
            </Text>
          </View>

          {debt.description && (
            <>
              <View style={styles.divider} />
              <View style={styles.descriptionSection}>
                <Text style={styles.infoLabel}>Keterangan</Text>
                <Text style={styles.description}>{debt.description}</Text>
              </View>
            </>
          )}
        </View>

        {!debt.isPaid && (
          <TouchableOpacity style={styles.paidButton} onPress={handleMarkAsPaid}>
            <Text style={styles.paidButtonText}>✓ Tandai Sebagai Lunas</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Hapus Transaksi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Tutup</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  hutangBadge: {
    backgroundColor: '#fee2e2',
  },
  piutangBadge: {
    backgroundColor: '#d1fae5',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  paidStatus: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  unpaidStatus: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  descriptionSection: {
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 20,
  },
  paidButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  paidButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
