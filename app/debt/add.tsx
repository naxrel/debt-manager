import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { StaticDB } from '@/data/staticDatabase';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// --- DESIGN SYSTEM & COLORS ---
const COLORS = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  primary: '#4F46E5',    // Indigo 600
  textMain: '#0F172A',   // Slate 900
  textSec: '#64748B',    // Slate 500
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  inputBg: '#F1F5F9',    // Slate 100
  danger: '#EF4444',     // Red 500
  success: '#10B981',    // Emerald 500
};

// --- CUSTOM CALENDAR COMPONENT ---
interface CalendarProps {
  selectedDate: dayjs.Dayjs;
  onSelectDate: (date: dayjs.Dayjs) => void;
}

const CustomCalendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf('month').day();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));

  const generateCalendarDays = () => {
    const days = [];
    
    // 1. Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-start-${i}`} style={styles.calendarDay} />);
    }
    
    // 2. Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentMonth.date(day);
      const isSelected = date.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
      const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
      
      days.push(
        <TouchableOpacity
          key={day}
          style={styles.calendarDay}
          onPress={() => onSelectDate(date)}
          activeOpacity={0.7}
        >
          <View style={[
             styles.dayContainer, 
             isSelected && styles.dayContainerSelected,
             isToday && !isSelected && styles.dayContainerToday
          ]}>
            <Text style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              isToday && !isSelected && styles.calendarDayTextToday
            ]}>
              {day}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    // 3. Fill remaining slots
    const totalSlots = days.length;
    const remainder = totalSlots % 7;
    if (remainder !== 0) {
        const slotsNeeded = 7 - remainder;
        for (let i = 0; i < slotsNeeded; i++) {
            days.push(<View key={`empty-end-${i}`} style={styles.calendarDay} />);
        }
    }
    
    return days;
  };

  const renderWeeks = () => {
    const days = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(
        <View key={i} style={styles.calendarWeek}>
          {days.slice(i, i + 7)}
        </View>
      );
    }
    return weeks;
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={previousMonth} style={styles.calendarNavButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        
        <Text style={styles.calendarTitle}>
          {currentMonth.format('MMMM YYYY')}
        </Text>
        
        <TouchableOpacity onPress={nextMonth} style={styles.calendarNavButton} hitSlop={10}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarWeekdays}>
        {weekdays.map(day => (
          <Text key={day} style={styles.calendarWeekdayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {renderWeeks()}
      </View>
    </View>
  );
};

// --- MAIN SCREEN ---
export default function AddDebtScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addDebt } = useDebt();

  const [type, setType] = useState<'hutang' | 'piutang'>('piutang');
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(dayjs());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Logic Handlers ---
  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }
    if (!username || !amount) {
      Alert.alert('Missing Info', 'Please fill in username and amount');
      return;
    }
    const amountNumber = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number');
      return;
    }

    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    const otherUser = StaticDB.getUserByUsername(cleanUsername);
    
    if (!otherUser) {
      Alert.alert('User Not Found', `Username @${cleanUsername} is not registered.`);
      return;
    }

    if (otherUser.id === user.id) {
       Alert.alert('Error', 'You cannot create a transaction with yourself.');
       return;
    }

    try {
      addDebt({
        type,
        name: otherUser.name,
        otherUserId: otherUser.id,
        amount: amountNumber,
        description,
        date: date.format('YYYY-MM-DD'),
        isPaid: false,
        status: 'pending',
        initiatedBy: user.id,
      });

      Alert.alert('Success', `Transaction created successfully!`, [{ 
          text: 'OK', 
          onPress: () => router.back() 
      }]);
    } catch (error) {
       Alert.alert('Error', 'Failed to create transaction');
    }
  };

  const formatNumber = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatNumber(text));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={10}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke={COLORS.textMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        keyboardShouldPersistTaps="handled" 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* --- UNIQUE TAB SWITCHER (Floating Island) --- */}
        <View style={styles.tabTrack}>
            
            {/* Tab: Hutang (I Owe) */}
            <TouchableOpacity
                style={[
                    styles.tabButton, 
                    type === 'hutang' ? styles.tabActive : styles.tabInactive
                ]}
                onPress={() => {
                    Haptics.selectionAsync();
                    setType('hutang');
                }}
                activeOpacity={0.9}
            >
                <Ionicons 
                    name={type === 'hutang' ? "arrow-down-circle" : "arrow-down-circle-outline"} 
                    size={20} 
                    color={type === 'hutang' ? COLORS.danger : COLORS.textTertiary} 
                    style={{marginRight: 8}}
                />
                <Text style={[
                    styles.tabText, 
                    type === 'hutang' ? { color: COLORS.danger, fontFamily: Font.bold } : { color: COLORS.textSec }
                ]}>
                    I Owe
                </Text>
                
                {/* Dot Indicator */}
                {type === 'hutang' && <View style={[styles.activeDot, { backgroundColor: COLORS.danger }]} />}
            </TouchableOpacity>

            {/* Tab: Piutang (Owes Me) */}
            <TouchableOpacity
                style={[
                    styles.tabButton, 
                    type === 'piutang' ? styles.tabActive : styles.tabInactive
                ]}
                onPress={() => {
                    Haptics.selectionAsync();
                    setType('piutang');
                }}
                activeOpacity={0.9}
            >
                <Ionicons 
                    name={type === 'piutang' ? "arrow-up-circle" : "arrow-up-circle-outline"} 
                    size={20} 
                    color={type === 'piutang' ? COLORS.success : COLORS.textTertiary} 
                    style={{marginRight: 8}}
                />
                <Text style={[
                    styles.tabText, 
                    type === 'piutang' ? { color: COLORS.success, fontFamily: Font.bold } : { color: COLORS.textSec }
                ]}>
                    Owes Me
                </Text>

                {/* Dot Indicator */}
                {type === 'piutang' && <View style={[styles.activeDot, { backgroundColor: COLORS.success }]} />}
            </TouchableOpacity>

        </View>

        {/* --- FORM SECTION --- */}
        <View style={styles.formCard}>
            
            {/* Input: Username */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Who is this for?</Text>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputPrefix}>@</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="username"
                        placeholderTextColor={COLORS.textTertiary}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            {/* Input: Amount */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>How much?</Text>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputPrefix}>Rp</Text>
                    <TextInput
                        style={[styles.input, styles.amountInput]}
                        placeholder="0"
                        placeholderTextColor={COLORS.textTertiary}
                        value={amount}
                        onChangeText={handleAmountChange}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Input: Date */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>When?</Text>
                <TouchableOpacity
                    style={styles.dateInputButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={{marginRight: 10}} />
                    <Text style={styles.dateInputText}>{date.format('DD MMMM YYYY')}</Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.textTertiary} style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
            </View>

            {/* Input: Note */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                    style={[styles.inputWrapper, styles.textArea]}
                    placeholder="What is this for? (e.g. Lunch, Taxi)"
                    placeholderTextColor={COLORS.textTertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    maxLength={200}
                />
                <Text style={styles.charCount}>{description.length}/200</Text>
            </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>Create Transaction</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* --- DATE PICKER MODAL --- */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContentWrapper} 
          >
            <View style={styles.datePickerModal}>
              <View style={styles.modalHeaderBar} />
              <Text style={styles.datePickerTitle}>Select Date</Text>
              
              <CustomCalendar
                selectedDate={date}
                onSelectDate={(newDate) => setDate(newDate)}
              />
              
              <TouchableOpacity
                style={styles.datePickerCloseButton}
                onPress={() => setShowDatePicker(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.datePickerCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { 
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: COLORS.textMain,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // --- NEW UNIQUE TAB STYLES ---
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9', // Abu-abu muda soft
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
    height: 60,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    // Shadow melayang
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tabInactive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontFamily: Font.semiBold,
  },
  activeDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      position: 'absolute',
      bottom: 8,
  },

  // --- FORM INPUTS ---
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputPrefix: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: COLORS.textTertiary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
  },
  amountInput: {
    fontSize: 18,
    color: COLORS.primary,
  },
  dateInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateInputText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: COLORS.textMain,
  },
  textArea: {
    paddingVertical: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    fontFamily: Font.regular,
    color: COLORS.textMain,
  },
  charCount: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 6,
  },

  // --- BUTTONS ---
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Font.bold,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSec,
    fontSize: 16,
    fontFamily: Font.semiBold,
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeaderBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  datePickerTitle: {
    fontSize: 18,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerCloseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  datePickerCloseButtonText: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#ffffff',
  },

  // --- CALENDAR STYLES ---
  calendarContainer: {
    marginBottom: 0,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  calendarNavButton: {
    padding: 5,
  },
  calendarTitle: {
    fontSize: 17,
    fontFamily: Font.semiBold,
    color: '#000000',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 10,
  },
  calendarWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: Font.semiBold,
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  calendarGrid: {},
  calendarWeek: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  dayContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  dayContainerToday: {
    backgroundColor: '#F2F2F7',
  },
  calendarDayText: {
    fontSize: 17,
    fontFamily: Font.regular,
    color: '#000000',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontFamily: Font.semiBold,
  },
  calendarDayTextToday: {
    color: COLORS.primary,
    fontFamily: Font.semiBold,
  },
});