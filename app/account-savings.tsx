import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethod, StaticDB } from '@/data/staticDatabase';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; // *Recommended: Install expo-haptics
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    LayoutAnimation,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';

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
            'Are you sure to delete this payment method?',
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
            {/* Clean Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={20} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Methods</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {paymentMethods.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="wallet-outline" size={48} color="#9ca3af" />
                        </View>
                        <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
                        <Text style={styles.emptyStateText}>Add your first payment method to get started</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={openAddModal} activeOpacity={0.8}>
                            <Text style={styles.emptyButtonText}>Add Method</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {paymentMethods.map((payment, index) => (
                            <TouchableOpacity 
                                key={payment.id}
                                style={styles.card}
                                onPress={() => openEditModal(payment)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardLeft}>
                                    <View style={[styles.cardIcon, { backgroundColor: payment.type === 'bank' ? '#f0f9ff' : '#fef3f2' }]}>
                                        <Ionicons 
                                            name={getProviderIcon(payment.type) as any} 
                                            size={22} 
                                            color={payment.type === 'bank' ? '#0284c7' : '#dc2626'} 
                                        />
                                    </View>
                                    
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardTop}>
                                            <Text style={styles.cardProvider}>{payment.provider}</Text>
                                            {payment.isPrimary && (
                                                <View style={styles.primaryBadge}>
                                                    <Text style={styles.primaryBadgeText}>Primary</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.cardNumber}>{payment.accountNumber}</Text>
                                        <Text style={styles.cardType}>{getTypeLabel(payment.type)}</Text>
                                    </View>
                                </View>
                                
                                <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                            </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity style={styles.addCard} onPress={openAddModal} activeOpacity={0.7}>
                            <Ionicons name="add-circle-outline" size={24} color="#6b7280" />
                            <Text style={styles.addCardText}>Add New Payment Method</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Clean Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddModal(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowAddModal(false)} hitSlop={20}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{editingPayment ? 'Edit Payment' : 'New Payment'}</Text>
                        <TouchableOpacity onPress={handleSave} hitSlop={20}>
                            <Ionicons name="checkmark" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
                        {/* Account Type */}
                        <Text style={styles.sectionLabel}>Account Type</Text>
                        <View style={styles.typeContainer}>
                            <Pressable 
                                style={[styles.typeButton, selectedType === 'bank' && styles.typeButtonActive]} 
                                onPress={() => { setSelectedType('bank'); triggerHaptic('light'); }}
                            >
                                <Ionicons 
                                    name="card-outline" 
                                    size={22} 
                                    color={selectedType === 'bank' ? '#ffffff' : '#6b7280'} 
                                />
                                <Text style={[styles.typeButtonText, selectedType === 'bank' && styles.typeButtonTextActive]}>
                                    Bank Transfer
                                </Text>
                            </Pressable>
                            
                            <Pressable 
                                style={[styles.typeButton, selectedType === 'ewallet' && styles.typeButtonActive]} 
                                onPress={() => { setSelectedType('ewallet'); triggerHaptic('light'); }}
                            >
                                <Ionicons 
                                    name="wallet-outline" 
                                    size={22} 
                                    color={selectedType === 'ewallet' ? '#ffffff' : '#6b7280'} 
                                />
                                <Text style={[styles.typeButtonText, selectedType === 'ewallet' && styles.typeButtonTextActive]}>
                                    E-Wallet
                                </Text>
                            </Pressable>
                        </View>

                        {/* Details */}
                        <Text style={styles.sectionLabel}>Details</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabelText}>Provider Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. BCA, Mandiri, GoPay"
                                placeholderTextColor="#9ca3af"
                                value={selectedProvider}
                                onChangeText={setSelectedProvider}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabelText}>Account Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1234567890"
                                placeholderTextColor="#9ca3af"
                                value={accountNumber}
                                onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                            />
                        </View>

                        {/* Primary Toggle */}
                        <Pressable 
                            style={styles.primaryToggle}
                            onPress={() => { setIsPrimary(!isPrimary); triggerHaptic('light'); }}
                        >
                            <View style={styles.primaryToggleLeft}>
                                <Ionicons name="star" size={20} color="#6b7280" />
                                <View style={styles.primaryToggleText}>
                                    <Text style={styles.primaryToggleTitle}>Set as Primary</Text>
                                    <Text style={styles.primaryToggleSubtitle}>Use this as default payment method</Text>
                                </View>
                            </View>
                            <View style={[styles.toggle, isPrimary && styles.toggleActive]}>    
                                <View style={[styles.toggleThumb, isPrimary && styles.toggleThumbActive]} />
                            </View>
                        </Pressable>

                        {/* Delete Button */}
                        {editingPayment && (
                            <TouchableOpacity 
                                style={styles.deleteButton} 
                                onPress={() => {
                                    setShowAddModal(false);
                                    setTimeout(() => handleDelete(editingPayment.id), 300);
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Font.bold,
        color: '#111827',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardContent: {
        flex: 1,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardProvider: {
        fontSize: 16,
        fontFamily: Font.bold,
        color: '#111827',
        marginRight: 8,
    },
    cardNumber: {
        fontSize: 15,
        fontFamily: Font.regular,
        color: '#4b5563',
        marginBottom: 2,
    },
    cardType: {
        fontSize: 13,
        fontFamily: Font.regular,
        color: '#9ca3af',
    },
    primaryBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    primaryBadgeText: {
        fontSize: 11,
        fontFamily: Font.semiBold,
        color: '#1e40af',
    },
    addCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: 18,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#e5e7eb',
        marginTop: 4,
    },
    addCardText: {
        fontSize: 15,
        fontFamily: Font.semiBold,
        color: '#6b7280',
        marginLeft: 10,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontFamily: Font.bold,
        color: '#111827',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 15,
        fontFamily: Font.regular,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    emptyButton: {
        backgroundColor: '#111827',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    emptyButtonText: {
        fontSize: 15,
        fontFamily: Font.semiBold,
        color: '#ffffff',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: Font.bold,
        color: '#111827',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: Font.bold,
        color: '#111827',
        marginBottom: 12,
        marginTop: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        gap: 8,
    },
    typeButtonActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    typeButtonText: {
        fontSize: 14,
        fontFamily: Font.semiBold,
        color: '#6b7280',
    },
    typeButtonTextActive: {
        color: '#ffffff',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabelText: {
        fontSize: 14,
        fontFamily: Font.semiBold,
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 15,
        fontFamily: Font.regular,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    primaryToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 24,
    },
    primaryToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    primaryToggleText: {
        flex: 1,
    },
    primaryToggleTitle: {
        fontSize: 15,
        fontFamily: Font.semiBold,
        color: '#111827',
        marginBottom: 2,
    },
    primaryToggleSubtitle: {
        fontSize: 13,
        fontFamily: Font.regular,
        color: '#6b7280',
    },
    toggle: {
        width: 51,
        height: 31,
        borderRadius: 16,
        backgroundColor: '#e5e7eb',
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: '#111827',
    },
    toggleThumb: {
        width: 27,
        height: 27,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    toggleThumbActive: {
        alignSelf: 'flex-end',
    },
    deleteButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        alignSelf: 'center',
    },
});