import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethod, StaticDB } from '@/data/staticDatabase';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    LayoutAnimation,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    UIManager,
    View
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.7; // Tinggi drawer

type PaymentType = 'bank' | 'ewallet';

export default function AccountSavingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    
    // --- Data State ---
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
        StaticDB.getUserById(user?.id || '')?.paymentMethods || []
    );
    
    // --- UI State ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);

    // --- Form State ---
    const [selectedType, setSelectedType] = useState<PaymentType>('bank');
    const [selectedProvider, setSelectedProvider] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);

    // --- Animation Refs (Drawer Engine) ---
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // --- Pan Responder (Swipe Gesture) ---
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    closeDrawer();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 65,
                        friction: 11,
                    }).start();
                }
            },
        })
    ).current;

    // --- Animation Logic ---
    useEffect(() => {
        if (isDrawerOpen) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
            ]).start();
        }
    }, [isDrawerOpen]);

    const closeDrawer = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsDrawerOpen(false);
        });
    };

    // --- Helpers ---
    const getProviderIcon = (type: PaymentType): keyof typeof Ionicons.glyphMap => {
        return type === 'bank' ? 'card' : 'wallet';
    };

    const getTypeLabel = (type: PaymentType) => type === 'bank' ? 'Bank Account' : 'E-Wallet';

    const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
        Haptics.impactAsync(
            style === 'light' ? Haptics.ImpactFeedbackStyle.Light : 
            style === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : 
            Haptics.ImpactFeedbackStyle.Medium
        );
    };

    // --- Actions ---

    const handleOpenAdd = () => {
        triggerHaptic('light');
        setSelectedType('bank');
        setSelectedProvider('');
        setAccountNumber('');
        setIsPrimary(false);
        setEditingPayment(null);
        setIsDrawerOpen(true);
    };

    const handleOpenEdit = (payment: PaymentMethod) => {
        triggerHaptic('light');
        setEditingPayment(payment);
        setSelectedType(payment.type);
        setSelectedProvider(payment.provider);
        setAccountNumber(payment.accountNumber);
        setIsPrimary(payment.isPrimary || false);
        setIsDrawerOpen(true);
    };

    const handleSave = () => {
        if (!selectedProvider || !accountNumber) {
            triggerHaptic('heavy');
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

        triggerHaptic('medium');
        closeDrawer();
    };

    const handleDelete = (paymentId: string) => {
        triggerHaptic('medium');
        Alert.alert(
            'Delete Payment Method?',
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
                        closeDrawer();
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* --- Main Content --- */}
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
                        <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
                        <Text style={styles.emptyStateText}>Add your first payment method to get started</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={handleOpenAdd} activeOpacity={0.8}>
                            <Text style={styles.emptyButtonText}>Add now!</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {paymentMethods.map((payment) => (
                            <TouchableOpacity 
                                key={payment.id}
                                style={styles.card}
                                onPress={() => handleOpenEdit(payment)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardLeft}>
                                    <View style={[styles.cardIcon, { backgroundColor: payment.type === 'bank' ? '#f0f9ff' : '#fef3f2' }]}>
                                        <Ionicons 
                                            name={getProviderIcon(payment.type)} 
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
                        <TouchableOpacity style={styles.addCard} onPress={handleOpenAdd} activeOpacity={0.7}>
                            <Ionicons name="add-circle-outline" size={24} color="#6b7280" />
                            <Text style={styles.addCardText}>Add New Payment Method</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* --- Custom Drawer Modal --- */}
            <Modal
                visible={isDrawerOpen}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={closeDrawer}
            >
                <View style={styles.modalContainer}>
                    {/* Dark Overlay */}
                    <TouchableWithoutFeedback onPress={closeDrawer}>
                        <Animated.View 
                            style={[
                                styles.overlay,
                                {
                                    opacity: opacity.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 0.5],
                                    }),
                                },
                            ]} 
                        />
                    </TouchableWithoutFeedback>

                    {/* Draggable Sheet */}
                    <Animated.View
                        style={[
                            styles.sheet,
                            { transform: [{ translateY }] }
                        ]}
                    >
                        <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
                            <View style={styles.dragHandle} />
                        </View>

                        {/* FIX APPLIED HERE:
                          1. behavior="padding" works better for bottom sheets on Android
                          2. keyboardVerticalOffset tweaks the trigger point
                          3. style flex:1 ensures it fills the Animated.View space
                        */}
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
                            style={{ flex: 1 }}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
                        >
                            <View style={styles.sheetHeader}>
                                <TouchableOpacity onPress={closeDrawer} hitSlop={20}>
                                    <Ionicons name="close" size={24} color="#6b7280" />
                                </TouchableOpacity>
                                <Text style={styles.sheetTitle}>{editingPayment ? 'Edit Payment' : 'New Payment'}</Text>
                                <TouchableOpacity onPress={handleSave} hitSlop={20}>
                                    <Ionicons name="checkmark" size={24} color="#2563eb" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView 
                                style={styles.sheetContent} 
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled" // Important for scrolling while keyboard is open
                                contentContainerStyle={{ paddingBottom: 20 }}
                            >
                                {/* Account Type */}
                                <Text style={styles.sectionLabel}>Account Type</Text>
                                <View style={styles.typeContainer}>
                                    <Pressable 
                                        style={[styles.typeButton, selectedType === 'bank' && styles.typeButtonActive]} 
                                        onPress={() => { setSelectedType('bank'); triggerHaptic('light'); }}
                                    >
                                        <Ionicons 
                                            name="card-outline" 
                                            size={20} 
                                            color={selectedType === 'bank' ? '#ffffff' : '#6b7280'} 
                                        />
                                        <Text style={[styles.typeButtonText, selectedType === 'bank' && styles.typeButtonTextActive]}>
                                            Bank
                                        </Text>
                                    </Pressable>
                                    
                                    <Pressable 
                                        style={[styles.typeButton, selectedType === 'ewallet' && styles.typeButtonActive]} 
                                        onPress={() => { setSelectedType('ewallet'); triggerHaptic('light'); }}
                                    >
                                        <Ionicons 
                                            name="wallet-outline" 
                                            size={20} 
                                            color={selectedType === 'ewallet' ? '#ffffff' : '#6b7280'} 
                                        />
                                        <Text style={[styles.typeButtonText, selectedType === 'ewallet' && styles.typeButtonTextActive]}>
                                            E-Wallet
                                        </Text>
                                    </Pressable>
                                </View>

                                {/* Input Fields */}
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

                                {/* Actions Row */}
                                <View style={styles.actionsRow}>
                                    <Pressable 
                                        style={styles.primaryToggle}
                                        onPress={() => { setIsPrimary(!isPrimary); triggerHaptic('light'); }}
                                    >
                                        <View style={styles.primaryToggleLeft}>
                                            <View style={styles.iconBox}>
                                                <Ionicons name="star" size={18} color="#f59e0b" />
                                            </View>
                                            <View style={styles.primaryToggleText}>
                                                <Text style={styles.primaryToggleTitle}>Set as Primary</Text>
                                                <Text style={styles.primaryToggleSubtitle}>Use as default</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.toggle, isPrimary && styles.toggleActive]}>    
                                            <View style={[styles.toggleThumb, isPrimary && styles.toggleThumbActive]} />
                                        </View>
                                    </Pressable>

                                    {editingPayment && (
                                        <TouchableOpacity 
                                            style={styles.deleteButton} 
                                            onPress={() => handleDelete(editingPayment.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="trash-outline" size={22} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                
                                {/* Spacer for keyboard - ensures content can scroll above keyboard */}
                                <View style={{ height: 100 }} />
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    // --- Header Styles ---
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
    backButton: { padding: 4 },
    headerTitle: {
        fontSize: 20,
        fontFamily: Font.bold,
        color: '#111827',
    },
    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    
    // --- Card Styles ---
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
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardContent: { flex: 1 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
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
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
    emptyStateTitle: { fontSize: 20, fontFamily: Font.bold, color: '#111827', marginBottom: 8 },
    emptyStateText: { fontSize: 15, fontFamily: Font.regular, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    emptyButton: { backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
    emptyButtonText: { fontSize: 15, fontFamily: Font.semiBold, color: '#ffffff' },
    
    // --- Drawer / Modal Styles ---
    modalContainer: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: DRAWER_HEIGHT, // Height 85%
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    dragHandleArea: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#cbd5e1',
        borderRadius: 2,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    sheetTitle: {
        fontSize: 18,
        fontFamily: Font.bold,
        color: '#111827',
    },
    sheetContent: {
        flex: 1,
        padding: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: Font.semiBold,
        color: '#1e293b',
        marginBottom: 12,
        marginTop: 4,
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
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 8,
    },
    typeButtonActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    typeButtonText: {
        fontSize: 14,
        fontFamily: Font.semiBold,
        color: '#64748b',
    },
    typeButtonTextActive: { color: '#ffffff' },
    inputContainer: { marginBottom: 16 },
    inputLabelText: {
        fontSize: 13,
        fontFamily: Font.semiBold,
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 15,
        fontFamily: Font.regular,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
        marginBottom: 24,
    },
    primaryToggle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fffbeb',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    primaryToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconBox: {
        width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'
    },
    primaryToggleText: { flex: 1 },
    primaryToggleTitle: {
        fontSize: 14,
        fontFamily: Font.semiBold,
        color: '#92400e', // Dark yellow/brown
    },
    primaryToggleSubtitle: {
        fontSize: 12,
        fontFamily: Font.regular,
        color: '#b45309',
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e5e7eb',
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: { backgroundColor: '#f59e0b' },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    toggleThumbActive: { alignSelf: 'flex-end' },
    deleteButton: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    deleteButtonText: {
        fontSize: 15,
        fontFamily: Font.semiBold,
        color: '#ef4444',
    },
});