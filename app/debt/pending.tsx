import { Font } from '@/constants/theme';
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
  StatusBar
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

// --- DESIGN TOKENS ---
const COLORS = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTer: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  inputBg: '#F8FAFC',
};

const SPACING = 20;

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

    // Web handling simplified
    if (Platform.OS === 'web') {
        const confirmed = window.confirm('Approve this transaction?');
        if (confirmed) {
            const result = StaticDB.approveDebt(debtId, user.id);
            if (result.success) loadPendingDebts();
        }
        return;
    }

    Alert.alert(
      'Confirm Approval',
      'Are you sure you want to approve this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            const result = StaticDB.approveDebt(debtId, user.id);
            if (result.success) {
                // Remove item from list locally for instant feedback
                setPendingDebts(prev => prev.filter(d => d.id !== debtId));
                // Reload to be sure
                setTimeout(loadPendingDebts, 500); 
            } else {
              Alert.alert('Error', result.error || 'Failed to approve');
            }
          },
        },
      ]
    );
  };

  const handleRejectPress = (debtId: string) => {
      // Toggle reject mode
      if (selectedDebtId === debtId) {
          setSelectedDebtId(null);
          setRejectReason('');
      } else {
          setSelectedDebtId(debtId);
          setRejectReason('');
      }
  };

  const confirmReject = (debtId: string) => {
    if (!user) return;
    
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }

    const result = StaticDB.rejectDebt(debtId, user.id, rejectReason);
    if (result.success) {
        setPendingDebts(prev => prev.filter(d => d.id !== debtId));
        setRejectReason('');
        setSelectedDebtId(null);
        setTimeout(loadPendingDebts, 500);
    } else {
      Alert.alert('Error', result.error || 'Failed to reject');
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

  const renderDebtItem = ({ item, index }: { item: any; index: number }) => {
    const initiator = StaticDB.getUserById(item.initiatedBy);
    const isRejectMode = selectedDebtId === item.id;

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).springify()}
        layout={Layout.springify()}
        style={styles.card}
      >
        {/* Header: Badge & Date */}
        <View style={styles.cardTop}>
            <View style={[
                styles.badge, 
                item.type === 'hutang' ? styles.badgeError : styles.badgeSuccess
            ]}>
                <Text style={[
                    styles.badgeText,
                    item.type === 'hutang' ? styles.textError : styles.textSuccess
                ]}>
                    {item.type === 'hutang' ? 'CONFIRM DEBT' : 'CONFIRM PAYMENT'}
                </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
            <Text style={styles.initiatorText}>
                <Text style={{fontFamily: Font.bold, color: COLORS.textMain}}>@{initiator?.username}</Text> claims:
            </Text>
            
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
            
            <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Note:</Text>
                <Text style={styles.noteText}>{item.description || 'No description provided.'}</Text>
            </View>
        </View>

        {/* Reject Reason Input (Visible only in Reject Mode) */}
        {isRejectMode && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.rejectInputBox}>
                <TextInput
                    style={styles.input}
                    placeholder="Reason for rejection (e.g. Wrong amount)"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    autoFocus
                />
            </Animated.View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
            {isRejectMode ? (
                // Confirm Reject Actions
                <>
                    <TouchableOpacity 
                        style={[styles.button, styles.btnGhost]} 
                        onPress={() => handleRejectPress(item.id)}
                    >
                        <Text style={styles.btnTextGhost}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.btnDanger]} 
                        onPress={() => confirmReject(item.id)}
                    >
                        <Text style={styles.btnTextWhite}>Confirm Reject</Text>
                    </TouchableOpacity>
                </>
            ) : (
                // Normal Actions
                <>
                    <TouchableOpacity 
                        style={[styles.button, styles.btnOutline]} 
                        onPress={() => handleRejectPress(item.id)}
                    >
                        <Text style={styles.btnTextDanger}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.btnPrimary]} 
                        onPress={() => handleApprove(item.id)}
                    >
                        <Text style={styles.btnTextWhite}>Approve</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>

      </Animated.View>
    );
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={10}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke={COLORS.textMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={{width: 40}} /> 
      </View>

      <FlatList
        data={pendingDebts}
        renderItem={renderDebtItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{fontSize: 48, marginBottom: 16}}>👍</Text>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySub}>No pending transactions to review.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },

  // List
  listContent: {
    padding: SPACING,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Modern Shadow
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeError: { backgroundColor: '#FEE2E2' }, // Red-100
  badgeSuccess: { backgroundColor: '#D1FAE5' }, // Emerald-100
  badgeText: {
    fontSize: 10,
    fontFamily: Font.bold,
    letterSpacing: 0.5,
  },
  textError: { color: COLORS.danger },
  textSuccess: { color: COLORS.success },
  dateText: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: COLORS.textTer,
  },
  
  // Content
  content: {
    marginBottom: 16,
  },
  initiatorText: {
    fontSize: 14,
    color: COLORS.textSec,
    fontFamily: Font.regular,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 28,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 12,
  },
  noteContainer: {
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 12,
  },
  noteLabel: {
    fontSize: 11,
    fontFamily: Font.bold,
    color: COLORS.textTer,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  noteText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textMain,
    lineHeight: 20,
  },

  // Reject Input
  rejectInputBox: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FEF2F2', // Light Red BG for warning
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: Font.regular,
    color: COLORS.textMain,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  btnDanger: {
    backgroundColor: COLORS.danger,
  },
  btnGhost: {
    backgroundColor: COLORS.inputBg,
  },
  
  // Text Styles
  btnTextWhite: {
    color: '#FFF',
    fontFamily: Font.bold,
    fontSize: 14,
  },
  btnTextDanger: {
    color: COLORS.danger,
    fontFamily: Font.bold,
    fontSize: 14,
  },
  btnTextGhost: {
    color: COLORS.textSec,
    fontFamily: Font.bold,
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSec,
    fontFamily: Font.regular,
  },
});