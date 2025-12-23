import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { StaticDB } from '@/data/staticDatabase';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// --- BAGIAN INI DIMODIFIKASI UNTUK UI APPLE-LIKE & FIX LAYOUT ---

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
    
    // 3. FIX UTAMA: Tambahkan empty cells di akhir agar grid tetap rapi
    // Menghitung berapa sisa kotak yang dibutuhkan agar totalnya kelipatan 7
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
      {/* Header Month Navigation */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={previousMonth} style={styles.calendarNavButton} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        
        <Text style={styles.calendarTitle}>
          {currentMonth.format('MMMM YYYY')}
        </Text>
        
        <TouchableOpacity onPress={nextMonth} style={styles.calendarNavButton} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Weekday Labels (S M T W T F S) */}
      <View style={styles.calendarWeekdays}>
        {weekdays.map(day => (
          <Text key={day} style={styles.calendarWeekdayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {renderWeeks()}
      </View>
    </View>
  );
};

// --- LOGIC UTAMA (TIDAK BERUBAH BANYAK, HANYA PEMANGGILAN) ---

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

  // ... (Kode logic handleSubmit, formatNumber, dll sama persis seperti sebelumnya) ...
  // Saya persingkat bagian logic ini agar fokus ke solusi UI, 
  // Pastikan Anda menyalin logic handleSubmit, formatNumber, handleAmountChange dari kode lama Anda ke sini.
  
  const handleSubmit = () => {
    if (!user) {
      if (Platform.OS === 'web') alert('User tidak ditemukan');
      else Alert.alert('Error', 'User tidak ditemukan');
      return;
    }
    if (!username || !amount) {
      if (Platform.OS === 'web') alert('Username dan jumlah harus diisi');
      else Alert.alert('Error', 'Username dan jumlah harus diisi');
      return;
    }
    const amountNumber = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      if (Platform.OS === 'web') alert('Jumlah harus berupa angka yang valid');
      else Alert.alert('Error', 'Jumlah harus berupa angka yang valid');
      return;
    }

    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    const otherUser = StaticDB.getUserByUsername(cleanUsername);
    
    if (!otherUser) {
      if (Platform.OS === 'web') alert(`Username @${cleanUsername} belum terdaftar.`);
      else Alert.alert('Error', `Username @${cleanUsername} belum terdaftar.`);
      return;
    }

    if (otherUser.id === user.id) {
       if (Platform.OS === 'web') alert('Tidak bisa transaksi dengan diri sendiri');
       else Alert.alert('Error', 'Tidak bisa transaksi dengan diri sendiri');
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

      if (Platform.OS === 'web') {
        alert(`Transaksi berhasil dibuat`);
        router.back();
      } else {
        Alert.alert('Sukses', `Transaksi berhasil dibuat`, [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (error) {
       if (Platform.OS === 'web') alert('Gagal');
       else Alert.alert('Error', 'Gagal');
    }
  };

  const formatNumber = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatNumber(text));
  };

  const formatDate = (date: dayjs.Dayjs) => {
    return date.format('DD/MM/YYYY');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Transaksi</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scrollView}>
        <View style={styles.content}>
          {/* Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, styles.toggleButtonLeft, type === 'hutang' && styles.toggleButtonActive]}
              onPress={() => setType('hutang')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleButtonText, type === 'hutang' && styles.toggleButtonTextActive]}>- Debt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, styles.toggleButtonRight, type === 'piutang' && styles.toggleButtonActive]}
              onPress={() => setType('piutang')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleButtonText, type === 'piutang' && styles.toggleButtonTextActive]}>+ Receive</Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>To / From</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount*</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date*</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateInputText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder=""
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- MODAL STYLE UPDATE --- */}
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
            style={styles.modalContentWrapper} // Wrapper baru untuk web centering
          >
            <View style={styles.datePickerModal}>
              <View style={styles.modalHeaderBar} />
              <Text style={styles.datePickerTitle}>Select Date</Text>
              
              <CustomCalendar
                selectedDate={date}
                onSelectDate={setDate}
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
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: { 
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    flex: 1,
    textAlign: 'left',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#3f4451',
    borderRadius: 100,
    padding: 0,
    marginBottom: 24,
    height: 50,
    alignSelf: 'center',
    width: '80%',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    margin: 0,
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
  },
  toggleButtonRight: {
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
  },
  toggleButtonActive: {
    backgroundColor: '#282b30',
  },
  toggleButtonText: {
    fontSize: 20,
    fontFamily: Font.semiBold,
    color: '#9ca3af',
  },
  toggleButtonTextActive: {
    color: '#e7e7e7',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#6b7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    fontFamily: Font.regular,
    color: '#1f2937',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
  },
  dateInputText: {
    fontSize: 15,
    fontFamily: Font.regular,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.semiBold,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontFamily: Font.semiBold,
  },

  // --- MODAL STYLES (UPDATED) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly darker for focus
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentWrapper: {
    width: '100%',
    alignItems: 'center', // Penting untuk Web
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
    backgroundColor: '#2563eb',
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

  // --- CALENDAR STYLES (APPLE LOOK) ---
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
    color: '#8E8E93', // iOS Gray text
    textTransform: 'uppercase',
  },
  calendarGrid: {
    // Gap handled by flex layout now
  },
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
  // New container inside day for perfect circle
  dayContainer: {
    width: 36, // Fixed size for perfect circle
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18, // Half of width
  },
  dayContainerSelected: {
    backgroundColor: '#007AFF',
  },
  dayContainerToday: {
    backgroundColor: '#F2F2F7',
  },
  calendarDayText: {
    fontSize: 17, // Larger standard iOS size
    fontFamily: Font.regular,
    color: '#000000',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontFamily: Font.semiBold,
  },
  calendarDayTextToday: {
    color: '#007AFF',
    fontFamily: Font.semiBold,
  },
});