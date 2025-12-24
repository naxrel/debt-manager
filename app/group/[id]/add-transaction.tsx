import { groupsApi, groupTransactionsApi } from '@/api';
import { Font } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../../contexts/AuthContext';

export default function AddGroupTransaction() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = async () => {
    try {
      const groupData = await groupsApi.getById(id!);
      setGroup(groupData);
      setMembers(groupData.members || []);
    } catch (error) {
      console.error('Error loading group:', error);
      Alert.alert('Error', 'Gagal memuat data grup');
    }
  };

  // Real-time validation
  useEffect(() => {
    if (fromUserId && toUserId && fromUserId === toUserId) {
      setValidationError('Sender and receiver cannot be the same person');
    } else {
      setValidationError('');
    }
  }, [fromUserId, toUserId]);

  const getSelectedMember = (userId: string) => {
    return members.find(m => m.id === userId);
  };

  const handleFromSelect = (userId: string) => {
    setFromUserId(userId);
    setShowFromDropdown(false);
  };

  // Format amount with thousand separators
  const formatAmount = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';

    // Add thousand separators
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatAmount(text);
    setAmount(formatted);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(formatAmount(value.toString()));
  };

  // Parse formatted amount to number
  const getNumericAmount = () => {
    return parseFloat(amount.replace(/\./g, '')) || 0;
  };

  const handleSubmit = async () => {
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

    const numAmount = getNumericAmount();
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Masukkan deskripsi transaksi');
      return;
    }

    setIsLoading(true);

    try {
      await groupTransactionsApi.create({
        groupId: group.id,
        fromUserId,
        toUserId,
        amount: numAmount,
        description: description.trim(),
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      });

      setIsLoading(false);
      router.back();
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Gagal menambahkan transaksi');
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
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowFromDropdown(!showFromDropdown)}
          >
            {fromUserId ? (
              <View style={styles.dropdownSelected}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarTextSmall}>
                    {getSelectedMember(fromUserId)?.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.dropdownTextContainer}>
                  <Text style={styles.dropdownSelectedText}>
                    {getSelectedMember(fromUserId)?.name}
                  </Text>
                  <Text style={styles.dropdownSelectedUsername}>
                    @{getSelectedMember(fromUserId)?.username}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.dropdownPlaceholder}>Select sender</Text>
            )}
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                stroke="#666"
                strokeWidth="2"
                d={showFromDropdown ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}
              />
            </Svg>
          </TouchableOpacity>

          {showFromDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView
                style={styles.dropdownScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {members.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.dropdownItem,
                      fromUserId === member.id && styles.dropdownItemSelected,
                    ]}
                    onPress={() => handleFromSelect(member.id)}
                  >
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarTextSmall}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownItemText}>{member.name}</Text>
                      <Text style={styles.dropdownItemUsername}>@{member.username}</Text>
                    </View>
                    {fromUserId === member.id && (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          stroke="#007AFF"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </Svg>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {validationError ? (
          <View style={styles.validationError}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                stroke="#ef4444"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </Svg>
            <Text style={styles.validationErrorText}>{validationError}</Text>
          </View>
        ) : null}

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
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#bbb"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.quickAmountContainer}>
            <Text style={styles.quickAmountLabel}>Quick amount:</Text>
            <View style={styles.quickAmountButtons}>
              {[50000, 100000, 250000, 500000].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickAmountButtonText}>
                    {value >= 1000000
                      ? `${value / 1000000}M`
                      : `${value / 1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  amountInputContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currencyPrefix: {
    fontSize: 28,
    fontFamily: Font.bold,
    color: '#007AFF',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontFamily: Font.bold,
    color: '#333',
    padding: 0,
  },
  quickAmountContainer: {
    marginTop: 16,
  },
  quickAmountLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontFamily: Font.regular,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickAmountButton: {
    backgroundColor: '#E8F4FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  quickAmountButtonText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#007AFF',
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
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontSize: 16,
    fontFamily: Font.regular,
  },
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Font.semiBold,
  },
  dropdownSelectedUsername: {
    fontSize: 13,
    color: '#666',
    fontFamily: Font.regular,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F7FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Font.semiBold,
  },
  dropdownItemUsername: {
    fontSize: 13,
    color: '#666',
    fontFamily: Font.regular,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTextSmall: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Font.semiBold,
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  validationErrorText: {
    fontSize: 14,
    color: '#ef4444',
    fontFamily: Font.regular,
    flex: 1,
  },
});
