import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { StaticDB, User } from '@/data/staticDatabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// --- DESIGN TOKENS ---
const COLORS = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  textMain: '#0F172A',
  textSec: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
  inputBg: '#F1F5F9',
};

export default function AddGroupTransaction() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // --- STATE ---
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection Modals State
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);

  // --- DATA ---
  const group = id ? StaticDB.getGroupById(id) : null;
  const members = group?.memberIds
    .map(memberId => StaticDB.getUserById(memberId))
    .filter((u): u is User => u !== undefined) || [];

  // Default "From" to current user
  useEffect(() => {
    if (user && !fromUserId) {
        setFromUserId(user.id);
    }
  }, [user]);

  // --- HELPERS ---
  const getSelectedMember = (userId: string) => members.find(m => m.id === userId);

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatAmount(text));
  };

  const handleQuickAmount = (value: number) => {
    setAmount(formatAmount(value.toString()));
  };

  const getNumericAmount = () => parseFloat(amount.replace(/\./g, '')) || 0;

  const handleSubmit = () => {
    if (!group || !user || !fromUserId || !toUserId) {
        Alert.alert('Incomplete Data', 'Please select sender and receiver.');
        return;
    }
    if (fromUserId === toUserId) {
        Alert.alert('Invalid Transaction', 'Sender and receiver cannot be the same person.');
        return;
    }
    const numAmount = getNumericAmount();
    if (!numAmount || numAmount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount.');
        return;
    }
    if (!description.trim()) {
        Alert.alert('Missing Note', 'Please add a description for this transaction.');
        return;
    }

    setIsLoading(true);
    const result = StaticDB.addGroupTransaction({
      groupId: group.id,
      fromUserId,
      toUserId,
      amount: numAmount,
      description: description.trim(),
      date: new Date().toISOString(),
      isPaid: false,
      createdBy: user.id,
    });
    setIsLoading(false);

    if (result.success) {
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed to create transaction');
    }
  };

  if (!group || !user) return null;

  return (
    <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Expense</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* AMOUNT SECTION */}
        <View style={styles.amountSection}>
            <Text style={styles.labelCenter}>How much?</Text>
            <View style={styles.amountWrapper}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    autoFocus
                />
            </View>
            
            {/* Quick Amount Chips */}
            <View style={styles.quickChipsContainer}>
                {[50000, 100000, 200000].map((val) => (
                    <TouchableOpacity 
                        key={val} 
                        style={styles.quickChip} 
                        onPress={() => handleQuickAmount(val)}
                    >
                        <Text style={styles.quickChipText}>
                            {val / 1000}k
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* DETAILS CARD */}
        <View style={styles.card}>
            
            {/* FROM SELECTOR */}
            <View style={styles.fieldRow}>
                <View style={styles.iconBox}>
                    <Ionicons name="arrow-up-circle" size={24} color={COLORS.danger} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.fieldLabel}>Who paid?</Text>
                    <TouchableOpacity 
                        style={styles.selectorButton} 
                        onPress={() => setShowFromModal(true)}
                    >
                        <Text style={styles.selectorText}>
                            {getSelectedMember(fromUserId)?.name || 'Select Payer'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={COLORS.textSec} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            {/* TO SELECTOR */}
            <View style={styles.fieldRow}>
                <View style={styles.iconBox}>
                    <Ionicons name="arrow-down-circle" size={24} color={COLORS.success} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.fieldLabel}>For whom?</Text>
                    <TouchableOpacity 
                        style={styles.selectorButton} 
                        onPress={() => setShowToModal(true)}
                    >
                        <Text style={styles.selectorText}>
                            {getSelectedMember(toUserId)?.name || 'Select Receiver'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={COLORS.textSec} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            {/* NOTES INPUT */}
            <View style={styles.fieldRow}>
                <View style={styles.iconBox}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.textMain} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="What is this for? (e.g. Dinner)"
                        placeholderTextColor={COLORS.textSec}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>
            </View>
        </View>

      </ScrollView>

      {/* FOOTER BUTTON */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
            style={[
                styles.submitButton, 
                (!amount || !toUserId || !description) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!amount || !toUserId || !description || isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.submitButtonText}>Create Transaction</Text>
            )}
        </TouchableOpacity>
      </View>

      {/* --- MEMBER SELECTION MODALS --- */}
      
      {/* FROM MODAL */}
      <Modal visible={showFromModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowFromModal(false)}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Who Paid?</Text>
                </View>
                <ScrollView>
                    {members.map(m => (
                        <TouchableOpacity 
                            key={m.id} 
                            style={[styles.memberItem, fromUserId === m.id && styles.memberItemSelected]}
                            onPress={() => { setFromUserId(m.id); setShowFromModal(false); }}
                        >
                            <Text style={[styles.memberItemText, fromUserId === m.id && styles.memberItemTextSelected]}>
                                {m.name} {m.id === user.id ? '(You)' : ''}
                            </Text>
                            {fromUserId === m.id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </TouchableOpacity>
      </Modal>

      {/* TO MODAL */}
      <Modal visible={showToModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowToModal(false)}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>For Whom?</Text>
                </View>
                <ScrollView>
                    {members.map(m => (
                        <TouchableOpacity 
                            key={m.id} 
                            style={[
                                styles.memberItem, 
                                toUserId === m.id && styles.memberItemSelected,
                                fromUserId === m.id && {opacity: 0.5} // Disable selecting same user
                            ]}
                            onPress={() => { 
                                if (fromUserId !== m.id) {
                                    setToUserId(m.id); 
                                    setShowToModal(false); 
                                }
                            }}
                            disabled={fromUserId === m.id}
                        >
                            <Text style={[styles.memberItemText, toUserId === m.id && styles.memberItemTextSelected]}>
                                {m.name} {m.id === user.id ? '(You)' : ''}
                            </Text>
                            {toUserId === m.id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },

  // Amount Section
  amountSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  labelCenter: {
    fontSize: 14,
    color: COLORS.textSec,
    marginBottom: 10,
    fontFamily: Font.regular,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textSec,
    marginRight: 8,
    marginBottom: 4, // Alignment adjustment
  },
  amountInput: {
    fontSize: 48,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    padding: 0,
    minWidth: 100,
    textAlign: 'center',
  },
  quickChipsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  quickChip: {
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  quickChipText: {
    color: COLORS.primary,
    fontFamily: Font.bold,
    fontSize: 14,
  },

  // Details Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.textSec,
    fontFamily: Font.regular,
    marginBottom: 4,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },
  input: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: COLORS.textMain,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 52, // Align with text start
    marginVertical: 4,
  },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSec,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Font.bold,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBg,
  },
  memberItemSelected: {
    backgroundColor: COLORS.primarySoft,
  },
  memberItemText: {
    fontSize: 16,
    color: COLORS.textMain,
    fontFamily: Font.regular,
  },
  memberItemTextSelected: {
    color: COLORS.primary,
    fontFamily: Font.bold,
  },
});