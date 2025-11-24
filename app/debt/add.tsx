import { useDebt } from '@/contexts/DebtContext';
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
  const { addDebt } = useDebt();

  const [type, setType] = useState<'hutang' | 'piutang'>('piutang');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!name || !amount) {
      Alert.alert('Error', 'Nama dan jumlah harus diisi');
      return;
    }

    const amountNumber = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Error', 'Jumlah harus berupa angka yang valid');
      return;
    }

    try {
      addDebt({
        type,
        name,
        amount: amountNumber,
        description,
        date,
        isPaid: false,
      });

      Alert.alert('Sukses', 'Transaksi berhasil ditambahkan', [
        { text: 'OK', onPress: () => router.back() },
      ]);
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
            <Text style={styles.label}>Nama</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama orang yang terlibat"
              value={name}
              onChangeText={setName}
            />
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
