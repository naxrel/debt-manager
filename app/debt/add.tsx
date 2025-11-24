import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { StaticDB } from '@/data/staticDatabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddDebtScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addDebt } = useDebt();

  const [type, setType] = useState<'hutang' | 'piutang'>('piutang');
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!user) {
      Alert.alert('Error', 'User tidak ditemukan');
      return;
    }

    if (!username || !amount) {
      Alert.alert('Error', 'Username dan jumlah harus diisi');
      return;
    }

    const amountNumber = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Error', 'Jumlah harus berupa angka yang valid');
      return;
    }

    // Remove @ if present
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    
    // Check if username exists
    const otherUser = StaticDB.getUserByUsername(cleanUsername);
    
    if (!otherUser) {
      Alert.alert('Error', `Username @${cleanUsername} belum terdaftar. Pastikan username sudah register terlebih dahulu.`);
      return;
    }

    if (otherUser.id === user.id) {
      Alert.alert('Error', 'Tidak bisa membuat transaksi dengan diri sendiri');
      return;
    }

    try {
      addDebt({
        type,
        name: otherUser.name,
        otherUserId: otherUser.id,
        amount: amountNumber,
        description,
        date,
        isPaid: false,
        status: 'pending',
        initiatedBy: user.id,
      });

      Alert.alert(
        'Menunggu Persetujuan', 
        `Transaksi berhasil dibuat dan menunggu persetujuan dari @${cleanUsername}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan transaksi');
    }
  };

  const formatNumber = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatNumber(text);
    setAmount(formatted);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Tambah Transaksi</Text>

          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'piutang' && styles.typeButtonActive]}
              onPress={() => setType('piutang')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'piutang' && styles.typeButtonTextActive,
                ]}
              >
                Piutang
              </Text>
              <Text style={styles.typeButtonSubtext}>Orang berhutang ke saya</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, type === 'hutang' && styles.typeButtonActive]}
              onPress={() => setType('hutang')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'hutang' && styles.typeButtonTextActive,
                ]}
              >
                Hutang
              </Text>
              <Text style={styles.typeButtonSubtext}>Saya berhutang ke orang</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username Lawan</Text>
            <TextInput
              style={styles.input}
              placeholder="@username (harus sudah terdaftar)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              💡 Masukkan username lawan transaksi. Mereka harus approve terlebih dahulu.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jumlah (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Keterangan (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tambahkan keterangan"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Simpan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  typeButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  typeButtonTextActive: {
    color: '#2563eb',
  },
  typeButtonSubtext: {
    fontSize: 12,
    color: '#999',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
