import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethod, StaticDB } from '@/data/staticDatabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    LayoutAnimation,
    Platform,
    UIManager,
    KeyboardAvoidingView,
    Pressable
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics'; // *Recommended: Install expo-haptics

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PaymentType = 'bank' | 'ewallet';

export default function AccountSavingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
        StaticDB.getUserById(user?.id || '')?.paymentMethods || []
    );
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);

    // Form state
    const [selectedType, setSelectedType] = useState<PaymentType>('bank');
    const [selectedProvider, setSelectedProvider] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);

    const getProviderIcon = (type: PaymentType) => type === 'bank' ? 'card' : 'wallet';
    const getTypeLabel = (type: PaymentType) => type === 'bank' ? 'Bank Account' : 'E-Wallet';

    const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
        // Safe check if haptics are available
        Haptics.impactAsync(
            style === 'light' ? Haptics.ImpactFeedbackStyle.Light : 
            style === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : 
            Haptics.ImpactFeedbackStyle.Medium
        );
    };

    const openAddModal = () => {
        triggerHaptic('light');
        setSelectedType('bank');
        setSelectedProvider('');
        setAccountNumber('');
        setIsPrimary(false);
        setEditingPayment(null);
        setShowAddModal(true);
    };

    const openEditModal = (payment: PaymentMethod) => {
        triggerHaptic('light');
        setEditingPayment(payment);
        setSelectedType(payment.type);
        setSelectedProvider(payment.provider);
        setAccountNumber(payment.accountNumber);
        setIsPrimary(payment.isPrimary || false);
        setShowAddModal(true);
    };

    const handleSave = () => {
        if (!selectedProvider || !accountNumber) {
            triggerHaptic('heavy'); // Error feedback
            Alert.alert('Missing Information', 'Please fill in all fields to proceed.');
            return;
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        const newPaymentPayload = {
            type: selectedType,
            provider: selectedProvider,
            accountNumber,
            isPrimary
        };

        if (editingPayment) {
            const updated = paymentMethods.map(pm =>
                pm.id === editingPayment.id
                    ? { ...pm, ...newPaymentPayload }
                    : isPrimary ? { ...pm, isPrimary: false } : pm
            );
            setPaymentMethods(updated);
        } else {
            const newPayment: PaymentMethod = {
                id: `pm${Date.now()}`,
                ...newPaymentPayload
            };
            const updated = isPrimary
                ? [...paymentMethods.map(pm => ({ ...pm, isPrimary: false })), newPayment]
                : [...paymentMethods, newPayment];
            setPaymentMethods(updated);
        }

        triggerHaptic('medium'); // Success feedback
        setShowAddModal(false);
    };

    const handleDelete = (paymentId: string) => {
        triggerHaptic('medium');
        Alert.alert(
            'Remove Method?',
            'This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        setPaymentMethods(paymentMethods.filter(pm => pm.id !== paymentId));
                        triggerHaptic('medium');
                    },
                },
            ]
        );
    };

    const handleSetPrimary = (paymentId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        triggerHaptic('light');
        const updated = paymentMethods.map(pm => ({
            ...pm,
            isPrimary: pm.id === paymentId,
        }));
        setPaymentMethods(updated);
    };

    return (
        <View style={styles.container}>
            {/* Minimalist Native Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={20} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#007AFF" />
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Savings</Text>
                <TouchableOpacity onPress={openAddModal} hitSlop={20}>
                    <Ionicons name="add" size={28} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeader}>PAYMENT METHODS</Text>
                
                {paymentMethods.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="wallet" size={32} color="#94a3b8" />
                        </View>
                        <Text style={styles.emptyStateTitle}>No Accounts Yet</Text>
                        <Text style={styles.emptyStateText}>Add a bank or e-wallet to get started.</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {paymentMethods.map((payment, index) => (
                            <View key={payment.id}>
                                <TouchableOpacity 
                                    style={styles.row} 
                                    onPress={() => openEditModal(payment)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: payment.type === 'bank' ? '#EBF5FF' : '#FDF2F8' }]}>
                                        <Ionicons 
                                            name={getProviderIcon(payment.type) as any} 
                                            size={20} 
                                            color={payment.type === 'bank' ? '#007AFF' : '#DB2777'} 
                                        />
                                    </View>
                                    
                                    <View style={styles.rowContent}>
                                        <Text style={styles.rowTitle}>{payment.provider}</Text>
                                        <Text style={styles.rowSubtitle}>{payment.accountNumber} • {getTypeLabel(payment.type)}</Text>
                                    </View>

                                    {payment.isPrimary ? (
                                        <Text style={styles.primaryText}>Primary</Text>
                                    ) : (
                                        <TouchableOpacity onPress={() => handleSetPrimary(payment.id)} hitSlop={10}>
                                            <Ionicons name="star-outline" size={22} color="#C7C7CC" />
                                        </TouchableOpacity>
                                    )}
                                    
                                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                                {index < paymentMethods.length - 1 && <View style={styles.separator} />}
                            </View>
                        ))}
                    </View>
                )}
                <Text style={styles.footerNote}>Tap on a method to edit details or manage removal.</Text>
            </ScrollView>

            {/* Native-feel Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                presentationStyle="pageSheet" // iOS Native Sheet look
                onRequestClose={() => setShowAddModal(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Text style={styles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{editingPayment ? 'Edit' : 'New'} Account</Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={styles.modalDone}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} keyboardDismissMode="interactive">
                        <Text style={styles.formLabel}>ACCOUNT TYPE</Text>
                        <View style={styles.formGroup}>
                            <Pressable 
                                style={[styles.formRow, styles.formRowFirst]} 
                                onPress={() => { setSelectedType('bank'); triggerHaptic('light'); }}
                            >
                                <Text style={styles.formRowLabel}>Bank Transfer</Text>
                                {selectedType === 'bank' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                            </Pressable>
                            <View style={styles.formSeparator} />
                            <Pressable 
                                style={[styles.formRow, styles.formRowLast]} 
                                onPress={() => { setSelectedType('ewallet'); triggerHaptic('light'); }}
                            >
                                <Text style={styles.formRowLabel}>E-Wallet</Text>
                                {selectedType === 'ewallet' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                            </Pressable>
                        </View>

                        <Text style={styles.formLabel}>DETAILS</Text>
                        <View style={styles.formGroup}>
                            <View style={[styles.formRow, styles.formRowFirst]}>
                                <Text style={styles.inputLabel}>Provider</Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="e.g. BCA"
                                    placeholderTextColor="#C7C7CC"
                                    value={selectedProvider}
                                    onChangeText={setSelectedProvider}
                                />
                            </View>
                            <View style={styles.formSeparator} />
                            <View style={[styles.formRow, styles.formRowLast]}>
                                <Text style={styles.inputLabel}>Number</Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="1234567890"
                                    placeholderTextColor="#C7C7CC"
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        <Text style={styles.formLabel}>PREFERENCES</Text>
                        <View style={styles.formGroup}>
                            <View style={[styles.formRow, styles.formRowSingle]}>
                                <Text style={styles.formRowLabel}>Set as Primary</Text>
                                <Pressable 
                                    onPress={() => { setIsPrimary(!isPrimary); triggerHaptic('light'); }}
                                    style={[styles.switch, isPrimary && styles.switchActive]}
                                >
                                    <View style={[styles.switchThumb, isPrimary && styles.switchThumbActive]} />
                                </Pressable>
                            </View>
                        </View>

                        {editingPayment && (
                            <TouchableOpacity style={styles.deleteButton} onPress={() => {
                                setShowAddModal(false);
                                setTimeout(() => handleDelete(editingPayment.id), 300);
                            }}>
                                <Text style={styles.deleteButtonText}>Delete Payment Method</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // iOS System Gray 6
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 12,
        backgroundColor: '#F2F2F7',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 17,
        color: '#007AFF',
        fontFamily: Font.regular,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: Font.bold,
        color: '#000',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 20,
    },
    sectionHeader: {
        fontSize: 13,
        color: '#6c6c70',
        fontFamily: Font.regular,
        marginBottom: 8,
        marginLeft: 16,
        textTransform: 'uppercase',
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
        marginLeft: 60, // Indented separator
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowContent: {
        flex: 1,
        justifyContent: 'center',
    },
    rowTitle: {
        fontSize: 17,
        fontFamily: Font.semiBold,
        color: '#000',
        marginBottom: 2,
    },
    rowSubtitle: {
        fontSize: 14,
        fontFamily: Font.regular,
        color: '#8E8E93',
    },
    primaryText: {
        fontSize: 15,
        color: '#8E8E93',
        marginRight: 4,
        fontFamily: Font.regular,
    },
    footerNote: {
        fontSize: 13,
        color: '#8E8E93',
        marginHorizontal: 16,
        marginTop: 8,
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 40,
    },
    emptyIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontFamily: Font.bold,
        color: '#000',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#F2F2F7',
    },
    modalCancel: {
        fontSize: 17,
        color: '#007AFF',
        fontFamily: Font.regular,
    },
    modalDone: {
        fontSize: 17,
        color: '#007AFF',
        fontFamily: Font.bold,
    },
    modalTitle: {
        fontSize: 17,
        fontFamily: Font.bold,
        color: '#000',
    },
    modalContent: {
        flex: 1,
    },
    formLabel: {
        fontSize: 13,
        color: '#6c6c70',
        marginLeft: 16,
        marginBottom: 8,
        marginTop: 24,
        textTransform: 'uppercase',
    },
    formGroup: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 48,
        backgroundColor: '#fff',
    },
    formRowFirst: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    formRowLast: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    formRowSingle: {
        borderRadius: 10,
        justifyContent: 'space-between',
    },
    formSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
        marginLeft: 16,
    },
    formRowLabel: {
        fontSize: 17,
        fontFamily: Font.regular,
        color: '#000',
        flex: 1,
    },
    inputLabel: {
        width: 80,
        fontSize: 17,
        fontFamily: Font.regular,
        color: '#000',
    },
    inputField: {
        flex: 1,
        fontSize: 17,
        fontFamily: Font.regular,
        color: '#007AFF',
        textAlign: 'right',
    },
    deleteButton: {
        marginTop: 30,
        marginBottom: 60,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 17,
        color: '#FF3B30',
        fontFamily: Font.regular,
    },
    // Custom Switch
    switch: {
        width: 51,
        height: 31,
        borderRadius: 15.5,
        backgroundColor: '#E9E9EA',
        padding: 2,
    },
    switchActive: {
        backgroundColor: '#34C759',
    },
    switchThumb: {
        width: 27,
        height: 27,
        borderRadius: 13.5,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
    },
    switchThumbActive: {
        alignSelf: 'flex-end',
    },
});