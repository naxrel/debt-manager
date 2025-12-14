import { Font } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { StaticDB, User } from '../../../data/staticDatabase';

export default function AddGroupTransaction() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const group = id ? StaticDB.getGroupById(id) : null;
  const members = group?.memberIds
    .map(memberId => StaticDB.getUserById(memberId))
    .filter(u => u !== undefined) as User[];

  const handleSubmit = () => {
    if (!group || !user) {
      Alert.alert('Error', 'Data tidak valid');
      return;
    }

    if (!fromUserId || !toUserId) {
      Alert.alert('Error', 'Pilih pengirim dan penerima');
      return;
    }

    if (fromUserId === toUserId) {
      Alert.alert('Error', 'Pengirim dan penerima tidak boleh sama');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Masukkan deskripsi transaksi');
      return;
    }

    setIsLoading(true);

    const result = StaticDB.addGroupTransaction({
      groupId: group.id,
      fromUserId,
      toUserId,
      amount: numAmount,
      description: description.trim(),
      date: new Date().toISOString(), // Include timestamp for proper sorting
      isPaid: false,
      createdBy: user.id,
    });

    setIsLoading(false);

    if (result.success) {
      // Navigate back immediately to trigger refresh
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Gagal menambahkan transaksi');
    }
  };

  if (!group || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Data tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke="#007AFF" strokeWidth="2" d="m15 6-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>From</Text>
          <View style={styles.memberList}>
            {members.map(member => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberButton,
                  fromUserId === member.id && styles.memberButtonSelected,
                ]}
                onPress={() => setFromUserId(member.id)}
              >
                <View style={styles.memberInfo}>
                  <View
                    style={[
                      styles.avatar,
                      fromUserId === member.id && styles.avatarSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        fromUserId === member.id && styles.avatarTextSelected,
                      ]}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberUsername}>@{member.username}</Text>
                  </View>
                </View>
                {fromUserId === member.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <View style={styles.memberList}>
            {members.map(member => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberButton,
                  toUserId === member.id && styles.memberButtonSelected,
                ]}
                onPress={() => setToUserId(member.id)}
              >
                <View style={styles.memberInfo}>
                  <View
                    style={[
                      styles.avatar,
                      toUserId === member.id && styles.avatarSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        toUserId === member.id && styles.avatarTextSelected,
                      ]}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberUsername}>@{member.username}</Text>
                  </View>
                </View>
                {toUserId === member.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mr. Din chicken... etc"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!fromUserId ||
              !toUserId ||
              !amount ||
              !description.trim() ||
              isLoading) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !fromUserId ||
            !toUserId ||
            !amount ||
            !description.trim() ||
            isLoading
          }
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Done</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Font.semiBold,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  groupInfo: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  groupName: {
    fontSize: 18,
    color: '#1e40af',
    marginBottom: 4,
    fontFamily: Font.semiBold,
  },
  groupDescription: {
    fontSize: 14,
    color: '#60a5fa',
    fontFamily: Font.regular,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
    fontFamily: Font.semiBold,
  },
  memberList: {
    gap: 8,
  },
  memberButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSelected: {
    backgroundColor: '#007AFF',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.semiBold,
  },
  avatarTextSelected: {
    color: '#fff',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: Font.semiBold,
  },
  memberUsername: {
    fontSize: 13,
    color: '#666',
    fontFamily: Font.regular,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.bold,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    fontFamily: Font.regular,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Font.semiBold,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
    fontFamily: Font.regular,
  },
});
