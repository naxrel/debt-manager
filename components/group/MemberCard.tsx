import { Font } from '@/constants/theme';
import { PaymentMethod, StaticDB } from '@/data/staticDatabase';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_HEIGHT = SCREEN_HEIGHT * 0.55; // Tinggi maksimal bottom sheet (55% layar)

interface MemberCardProps {
  visible: boolean;
  onClose: () => void;
  member: {
    id: string;
    username: string;
    name: string;
    profileImage?: string;
    bankAccount?: string;
    bankName?: string;
    phoneNumber?: string;
  } | null; // Member bisa null
  headerPaddingTop?: number;
}

export default function MemberCard({ 
  visible, 
  onClose, 
  member,
  headerPaddingTop = 50 
}: MemberCardProps) {
  // Animasi
  const translateY = useRef(new Animated.Value(MAX_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pan responder untuk gesture swipe down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Hanya aktifkan pan jika gesture vertikal > 5
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Hanya izinkan geser ke bawah (dy > 0)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Jika digeser cukup jauh ke bawah (> 20% tinggi sheet), tutup sheet
        if (gestureState.dy > MAX_HEIGHT * 0.2) {
          closeModal();
        } else {
          // Jika tidak, kembalikan ke posisi semula (bounce back)
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

  // Effect untuk membuka/menutup modal & load data
  useEffect(() => {
    if (visible && member) {
      openModal();
      // Ambil metode pembayaran member
      const user = StaticDB.getUserById(member.id);
      if (user && user.paymentMethods) {
        setPaymentMethods(user.paymentMethods);
      } else {
        setPaymentMethods([]);
      }
    } else {
      // Reset state jika ditutup
      if (!visible) {
         // Kita tidak langsung menutup di sini karena butuh animasi close dulu
         // Logika close ada di fungsi closeModal()
      }
    }
  }, [visible, member]);

  const openModal = () => {
    // Animasi masuk (Fade In Overlay + Slide Up Sheet)
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
  };

  const closeModal = () => {
    // Animasi keluar
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: MAX_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose(); // Callback ke parent setelah animasi selesai
    });
  };

  const handleCopyAccount = async (paymentMethod: PaymentMethod) => {
    await Clipboard.setStringAsync(paymentMethod.accountNumber);
    setCopiedId(paymentMethod.id);
    // Reset icon copy setelah 2 detik
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper untuk icon bank/ewallet
  const getProviderIcon = (provider: string) => {
    const icons: { [key: string]: string } = {
      'BCA': 'card',
      'Mandiri': 'card',
      'BNI': 'card',
      'BRI': 'card',
      'GoPay': 'wallet',
      'OVO': 'wallet',
      'DANA': 'wallet',
      'ShopeePay': 'wallet',
    };
    return icons[provider] || 'card'; // Default icon
  };

  if (!visible || !member) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none" // Kita handle animasi sendiri
      statusBarTranslucent
      onRequestClose={closeModal} // Handle back button Android
    >
      <View style={styles.container}>
        {/* Dark Overlay (Background) */}
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View 
            style={[
              styles.overlay,
              {
                opacity: opacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5], // Opacity max 0.5
                }),
              },
            ]} 
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet Content */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle Area (Swipeable) */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={styles.dragHandle} />
          </View>

          {/* Sheet Header: Member Info */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                {member.profileImage ? (
                  <Image 
                    source={{ uri: member.profileImage }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={32} color="#2563eb" />
                )}
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberUsername}>@{member.username}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Sheet Content: Payment Methods */}
          <View style={styles.content}>
            {paymentMethods.length > 0 ? (
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <Text style={styles.infoLabel}>Payment Methods</Text>
                </View>
                {/* Horizontal Scroll untuk Payment Methods */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.paymentScrollContent}
                >
                  {paymentMethods.map((payment) => (
                    <View key={payment.id} style={styles.paymentCard}>
                      <View style={styles.paymentLeft}>
                        <View style={styles.paymentIconContainer}>
                          <Ionicons 
                            name={getProviderIcon(payment.provider) as any} 
                            size={20} 
                            color="#2563eb" 
                          />
                        </View>
                        <View style={styles.paymentInfo}>
                          <View style={styles.paymentProviderRow}>
                            <Text style={styles.paymentProvider}>{payment.provider}</Text>
                            {payment.isPrimary && (
                              <View style={styles.primaryBadge}>
                                <Text style={styles.primaryBadgeText}>Primary</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.paymentNumber}>{payment.accountNumber}</Text>
                          <Text style={styles.paymentType}>
                            {payment.type === 'bank' ? 'Bank Account' : 'E-Wallet'}
                          </Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.copyButton}
                        onPress={() => handleCopyAccount(payment)}
                      >
                        <Ionicons 
                          name={copiedId === payment.id ? "checkmark" : "copy-outline"} 
                          size={20} 
                          color={copiedId === payment.id ? "#10b981" : "#64748b"} 
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              // Empty State jika tidak ada payment method
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyStateText}>No payment methods added</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end', // Penting agar sheet muncul di bawah
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 30, // Padding bawah untuk area aman (iPhone X home indicator)
    width: '100%',
  },
  dragHandleArea: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  headerInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 20,
    fontFamily: Font.bold,
    color: '#1e293b',
    marginBottom: 4,
  },
  memberUsername: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#64748b',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 24,
  },
  content: {
    padding: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#1e293b',
  },
  paymentScrollContent: {
    paddingRight: 24,
    gap: 16,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: 290,
    // Soft shadow for card
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentProviderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentProvider: {
    fontSize: 15,
    fontFamily: Font.bold,
    color: '#1e293b',
  },
  primaryBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontFamily: Font.bold,
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  paymentNumber: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#334155',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paymentType: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#94a3b8',
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
    borderRadius: 16,
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#94a3b8',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});