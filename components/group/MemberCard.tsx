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
const MAX_HEIGHT = SCREEN_HEIGHT * 0.4; // 40% of screen height

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
  };
  headerPaddingTop?: number;
}

export default function MemberCard({ 
  visible, 
  onClose, 
  member,
  headerPaddingTop = 50 
}: MemberCardProps) {
  const translateY = useRef(new Animated.Value(MAX_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pan responder for swipe down gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeModal();
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

  useEffect(() => {
    if (visible) {
      openModal();
      // Fetch payment methods from database
      const user = StaticDB.getUserById(member.id);
      if (user && user.paymentMethods) {
        setPaymentMethods(user.paymentMethods);
      } else {
        setPaymentMethods([]);
      }
    } else {
      closeModalInstant();
    }
  }, [visible, member.id]);

  const openModal = () => {
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
      onClose();
    });
  };

  const closeModalInstant = () => {
    translateY.setValue(MAX_HEIGHT);
    opacity.setValue(0);
  };

  const handleCopyAccount = async (paymentMethod: PaymentMethod) => {
    await Clipboard.setStringAsync(paymentMethod.accountNumber);
    setCopiedId(paymentMethod.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getProviderIcon = (provider: string) => {
    const icons: { [key: string]: any } = {
      'BCA': 'card',
      'Mandiri': 'card',
      'BNI': 'card',
      'BRI': 'card',
      'GoPay': 'wallet',
      'OVO': 'wallet',
      'DANA': 'wallet',
      'ShopeePay': 'wallet',
    };
    return icons[provider] || 'card';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        {/* Dark overlay */}
        <TouchableWithoutFeedback onPress={closeModal}>
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

        {/* Bottom sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: MAX_HEIGHT,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
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

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content */}
          <View style={styles.content}>
            {/* Username */}
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Ionicons name="person-outline" size={20} color="#2563eb" />
                <Text style={styles.infoLabel}>Username</Text>
              </View>
              <Text style={styles.infoValue}>{member.username}</Text>
            </View>

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <Ionicons name="card-outline" size={20} color="#2563eb" />
                  <Text style={styles.infoLabel}>Payment Methods</Text>
                </View>
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
                            size={18} 
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
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
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
  },
  content: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#475569',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: Font.regular,
    color: '#1e293b',
    marginLeft: 28,
  },
  infoSubValue: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#64748b',
    marginLeft: 28,
    marginTop: 4,
  },
  paymentScrollContent: {
    paddingLeft: 28,
    paddingRight: 20,
    gap: 12,
    marginTop: 8,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: 280,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#1e293b',
  },
  primaryBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontFamily: Font.semiBold,
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  paymentNumber: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#2563eb',
    marginLeft: 8,
  },
});
