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
      const confirmed = window.confirm('Approve settlement from ' + debt.name + '?');
      if (confirmed) {
        const result = StaticDB.approveSettlement(debt.id, user.id);
        if (result.success) {
          refreshDebts();
          alert('Settlement approved successfully');
          router.back();
        } else {
          alert(result.error || 'Failed to approve');
        }
      }
      return;
    }

    Alert.alert(
      'Approve Settlement',
      'Approve settlement from ' + debt.name + '?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            const result = StaticDB.approveSettlement(debt.id, user.id);
            if (result.success) {
              refreshDebts();
              Alert.alert('Success', 'Settlement approved successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to approve');
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
      const confirmed = window.confirm('Reject settlement request from ' + debt.name + '?');
      if (confirmed) {
        const result = StaticDB.rejectSettlement(debt.id, user.id);
        if (result.success) {
          refreshDebts();
          alert('Settlement request rejected');
          router.back();
        } else {
          alert(result.error || 'Failed to reject');
        }
      }
      return;
    }

    Alert.alert(
      'Reject Settlement',
      'Reject settlement request from ' + debt.name + '?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            const result = StaticDB.rejectSettlement(debt.id, user.id);
            if (result.success) {
              refreshDebts();
              Alert.alert('Success', 'Settlement request rejected', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to reject');
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
        <Text style={styles.errorText}>Transaction not found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path stroke="#6b7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Amount - Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountHero}>{formatCurrency(debt.amount)}</Text>
          {debt.isPaid && (
            <View style={styles.paidBadgeInline}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </Svg>
              <Text style={styles.paidText}>Paid</Text>
            </View>
          )}
        </View>

        {/* Transaction Flow */}
        <View style={styles.flowSection}>
          <View style={styles.flowContainer}>
            <View style={styles.flowItem}>
              <Text style={styles.flowLabel}>From</Text>
              <Text style={styles.flowValue}>{debt.type === 'hutang' ? debt.name : 'Me'}</Text>
            </View>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.flowArrow}>
              <Path stroke="#d1d5db" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </Svg>
            <View style={[styles.flowItem, styles.flowItemRight]}>
              <Text style={styles.flowLabel}>To</Text>
              <Text style={styles.flowValue}>{debt.type === 'piutang' ? debt.name : 'Me'}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {formatDate(debt.date)}, {new Date(debt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {debt.description && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Note</Text>
              <Text style={styles.detailValue}>{debt.description}</Text>
            </View>
          )}
        </View>

        {/* Action Area */}
        {!debt.isPaid && user && (
          <View style={styles.actionSection}>
            {/* Scenario 1: User owes money (hutang) - not requested yet */}
            {debt.type === 'hutang' && debt.status !== 'settlement_requested' && (
              <TouchableOpacity 
                style={styles.swipeButton} 
                onPress={handleRequestSettlement}
                activeOpacity={0.8}
              >
                <Text style={styles.swipeButtonText}>Request Settlement</Text>
              </TouchableOpacity>
            )}

            {/* Scenario 2: User owes money - waiting for approval */}
            {debt.type === 'hutang' && debt.status === 'settlement_requested' && (
              <View style={styles.waitingContainer}>
                <View style={styles.waitingIndicator}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.waitingText}>Waiting approval from {debt.name}</Text>
                </View>
              </View>
            )}

            {/* Scenario 3: User is owed money (piutang) - has settlement request */}
            {debt.type === 'piutang' && debt.status === 'settlement_requested' && (
              <View style={styles.approvalSection}>
                <Text style={styles.requestText}>{debt.name} wants to settle this debt</Text>
                <View style={styles.approvalButtons}>
                  <TouchableOpacity 
                    style={styles.rejectButtonNew} 
                    onPress={handleRejectSettlement}
                    activeOpacity={0.8}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path stroke="#111827" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </Svg>
                    <Text style={styles.rejectButtonTextNew}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.approveButtonNew} 
                    onPress={handleApproveSettlement}
                    activeOpacity={0.8}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </Svg>
                    <Text style={styles.approveButtonTextNew}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Scenario 4: User is owed money - waiting for them to request */}
            {debt.type === 'piutang' && debt.status !== 'settlement_requested' && (
              <View style={styles.waitingContainer}>
                <View style={styles.waitingIndicatorInactive}>
                  <View style={styles.inactiveDot} />
                  <Text style={styles.waitingTextInactive}>Waiting {debt.name} to request settlement</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    fontFamily: Font.regular,
  },
  errorButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.semiBold,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.semiBold,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  
  // Hero Amount Section
  heroSection: {
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
    marginBottom: 8,
  },
  amountHero: {
    fontSize: 48,
    fontFamily: Font.bold,
    color: '#111827',
    marginBottom: 4,
  },
  paidBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  paidText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#10b981',
  },

  // Transaction Flow Section
  flowSection: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  flowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flowItem: {
    flex: 1,
  },
  flowItemRight: {
    alignItems: 'flex-end',
  },
  flowLabel: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#9ca3af',
    marginBottom: 4,
  },
  flowValue: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#111827',
  },
  flowArrow: {
    marginTop: 12,
  },

  // Details Section
  detailsSection: {
    marginBottom: 32,
  },
  detailItem: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: '#111827',
    lineHeight: 24,
  },

  // Action Section
  actionSection: {
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },

  // Waiting States
  waitingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  waitingText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#f59e0b',
  },
  waitingIndicatorInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  waitingTextInactive: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#9ca3af',
  },

  // Approval Section
  approvalSection: {
    gap: 16,
  },
  requestText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 16,
  },
  approvalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButtonNew: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButtonTextNew: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#111827',
  },
  approveButtonNew: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  approveButtonTextNew: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#ffffff',
  },

  // Swipe Button Style
  swipeButton: {
    backgroundColor: '#111827',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeButtonText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#ffffff',
  },
});
