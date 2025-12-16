import { BottomLeftArrow, RightArrow, TopRightArrow } from '@/components/ArrowIcons';
import { CustomToast } from '@/components/CustomToast';
import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DebtGroup, GroupTransaction, StaticDB } from '@/data/staticDatabase';
import { DebtOptimizer, OptimizedDebt } from '@/utils/debtOptimizer';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<DebtGroup | null>(null);
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [optimizedDebts, setOptimizedDebts] = useState<OptimizedDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupImage, setEditGroupImage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<OptimizedDebt | null>(null);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error'
  });
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{ requestId: string; amount: number } | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [pendingReject, setPendingReject] = useState<string | null>(null);

  // Auto refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [id])
  );

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = () => {
    if (!id || !user) return;

    const groupData = StaticDB.getGroupById(id);
    if (!groupData) {
      Alert.alert('Error', 'Grup tidak ditemukan', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    setGroup(groupData);
    
    // Load pending settlement requests for current user
    const pending = StaticDB.getPendingSettlementRequests(user.id, id);
    setPendingRequests(pending);
    const groupTransactions = StaticDB.getGroupTransactions(id);
    setTransactions(groupTransactions);

    // Calculate optimization for this group only
    const members = groupData.memberIds
      .map(memberId => StaticDB.getUserById(memberId))
      .filter(u => u !== undefined);

    // Calculate balances manually from group transactions
    const balanceMap = new Map<string, number>();
    
    // Initialize all members with 0 balance
    groupData.memberIds.forEach(memberId => {
      balanceMap.set(memberId, 0);
    });

    // Calculate net balance for each member (only unpaid transactions)
    const unpaidTransactions = groupTransactions.filter(t => !t.isPaid);
    console.log('Total Transactions:', groupTransactions.length);
    console.log('Unpaid Transactions:', unpaidTransactions.length);
    console.log('Unpaid Details:', unpaidTransactions.map(t => ({
      from: StaticDB.getUserById(t.fromUserId)?.name,
      to: StaticDB.getUserById(t.toUserId)?.name,
      amount: t.amount,
      isPaid: t.isPaid
    })));
    
    unpaidTransactions.forEach(t => {
      // fromUser owes money (negative balance)
      const fromBalance = balanceMap.get(t.fromUserId) || 0;
      balanceMap.set(t.fromUserId, fromBalance - t.amount);
      
      // toUser is owed money (positive balance)
      const toBalance = balanceMap.get(t.toUserId) || 0;
      balanceMap.set(t.toUserId, toBalance + t.amount);
    });

    console.log('Balance Map:', Array.from(balanceMap.entries()));

    // Convert to UserBalance format
    const userBalances = members.map(member => ({
      userId: member.id,
      userName: member.name,
      balance: balanceMap.get(member.id) || 0,
    }));

    console.log('User Balances:', userBalances);

    // Optimize using the balance
    const optimizedDebts = DebtOptimizer.optimizeDebts(userBalances);
    
    console.log('Optimized Debts:', optimizedDebts);
    
    setOptimizedDebts(optimizedDebts);
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGroupData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddTransaction = () => {
    router.push(`/group/${id}/add-transaction`);
  };

  const openMembersDrawer = () => {
    setShowMembersDrawer(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMembersDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowMembersDrawer(false));
  };

  const handleDeleteGroup = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!group) return;

    if (deleteConfirmText.trim() === group.name) {
      setShowDeleteModal(false);
      executeDelete();
    } else {
      Alert.alert('Error', `Nama grup tidak sesuai. Ketik "${group.name}" dengan benar.`);
    }
  };

  const executeDelete = () => {
    if (!group) return;

    const result = StaticDB.deleteGroup(group.id);
    if (result.success) {
      Alert.alert('Berhasil', 'Grup berhasil dihapus', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Gagal menghapus grup');
    }
  };

  const handleAddMember = () => {
    if (!group || !newMemberUsername.trim()) {
      setAddMemberError('Masukkan username');
      return;
    }

    const foundUser = StaticDB.getUserByUsername(newMemberUsername.trim());
    
    if (!foundUser) {
      setAddMemberError(`Username "${newMemberUsername}" tidak ditemukan`);
      return;
    }

    if (group.memberIds.includes(foundUser.id)) {
      setAddMemberError('User sudah menjadi anggota grup');
      return;
    }

    const result = StaticDB.addMemberToGroup(group.id, foundUser.id);
    
    if (result.success) {
      setShowAddMemberModal(false);
      setNewMemberUsername('');
      setAddMemberError('');
      loadGroupData(); // Refresh
      Alert.alert('Berhasil', `${foundUser.name} successfully added to group`);
    } else {
      setAddMemberError(result.error || 'Failed to invite group');
    }
  };

  const handlePickGroupImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Accessing gallery needed your permission');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEditGroupImage(result.assets[0].uri);
    }
  };

  const handleSaveGroupEdit = () => {
    if (!group || !editGroupName.trim()) {
      if (Platform.OS === 'web') {
        alert('You should fill atleast the name, y\'know');
      } else {
        Alert.alert('Error', 'Nama grup tidak boleh kosong');
      }
      return;
    }

    const result = StaticDB.updateGroup(group.id, {
      name: editGroupName.trim(),
      description: editGroupDescription.trim(),
      groupImage: editGroupImage || undefined,
    });

    if (result.success) {
      setShowEditModal(false);
      loadGroupData();
      if (Platform.OS === 'web') {
        alert('Grup berhasil diperbarui');
      } else {
        Alert.alert('Berhasil', 'Grup berhasil diperbarui');
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Gagal memperbarui grup');
      } else {
        Alert.alert('Error', result.error || 'Gagal memperbarui grup');
      }
    }
  };

  const handlePayDebt = (debt: OptimizedDebt) => {
    setSelectedDebt(debt);
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    if (!selectedDebt || !group || !user) return;

    // Create settlement request instead of direct transaction
    const result = StaticDB.createSettlementRequest(
      group.id,
      selectedDebt.from,
      selectedDebt.to,
      selectedDebt.amount,
      paymentDescription.trim() || `Settlement: ${selectedDebt.fromName} → ${selectedDebt.toName}`
    );

    setShowPaymentModal(false);
    setSelectedDebt(null);
    setPaymentDescription('');
    loadGroupData();

    if (result.success) {
      setToast({
        visible: true,
        message: 'Settlement successfully sent. Waiting for approval ⏳',
        type: 'success'
      });
    } else {
      setToast({
        visible: true,
        message: result.error || 'Failed to send request',
        type: 'error'
      });
    }
  };

  const handleApproveSettlement = (requestId: string, amount: number) => {
    setPendingApproval({ requestId, amount });
    setShowApprovalConfirm(true);
  };

  const confirmApproveSettlement = () => {
    if (!user || !pendingApproval) return;

    console.log('Approving settlement request:', pendingApproval.requestId);
    const result = StaticDB.approveSettlementRequest(pendingApproval.requestId, user.id);
    console.log('Approval result:', result);

    setShowApprovalConfirm(false);
    setPendingApproval(null);

    if (result.success) {
      loadGroupData();
      
      setToast({
        visible: true,
        message: `🎉 Payment approved! ${formatCurrency(pendingApproval.amount)} has been settled`,
        type: 'success'
      });
    } else {
      setToast({
        visible: true,
        message: result.error || 'Failed to approve request',
        type: 'error'
      });
    }
  };

  const handleRejectSettlement = (requestId: string) => {
    setPendingReject(requestId);
    setShowRejectConfirm(true);
  };

  const confirmRejectSettlement = () => {
    if (!user || !pendingReject) return;

    const result = StaticDB.rejectSettlementRequest(
      pendingReject,
      user.id,
      'Request rejected'
    );

    setShowRejectConfirm(false);
    setPendingReject(null);

    if (result.success) {
      loadGroupData();
      setToast({
        visible: true,
        message: 'Request rejected',
        type: 'error'
      });
    } else {
      setToast({
        visible: true,
        message: result.error || 'Failed to reject request',
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!group || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No data existed.</Text>
      </View>
    );
  }

  const myOptimizedDebts = DebtOptimizer.getUserSuggestions(user.id, optimizedDebts);
  const stats = StaticDB.getGroupStatistics(group.id);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path stroke="#1f2937" strokeWidth="2" d="m15 6-6 6 6 6" />
              </Svg>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              {user && group.creatorId === user.id ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditGroupName(group.name);
                    setEditGroupDescription(group.description);
                    setEditGroupImage(group.groupImage || null);
                    setShowEditModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  {/* Settings Button */}
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12.632 2V1zm.83.07.369-.93zm.521.472.89-.458zm.153.82.995-.1zm.295 1.456-.795.607zm.928.385.134.991zm1.239-.822-.633-.774zm.688-.472-.304-.953zm.701.035.398-.917zm.638.538-.707.708zm.893.893.707-.707zm.538.638.917-.398zm.035.7.952.305zm-.473.688.774.634zm-.821 1.239-.991-.135v.001zm.385.928-.607.795zm1.457.295.1-.995zm.82.154.459-.889zm.47.52.93-.368zm.071.831h1zm0 1.264h1zm-.07.83.93.369zm-.472.521.458.89zm-.82.153.1.995zm-1.455.295-.607-.796zm-.385.928-.991.134zm.821 1.239.774-.634zm.472.686.952-.304zm-.035.702.917.398zm-2.069 2.069.398.917zm-.7.035-.305.953zm-.69-.472.634-.774zm-1.239-.822.133-.991zm-.927.385-.795-.607zm-.295 1.457-.995-.1zm-.153.82.89.458zm-.52.472.368.93zm-2.095.07v1zm-.83-.07-.369.93zm-.521-.471-.889.459zm-.154-.82-.995.1zm-.295-1.457.796-.607zm-.928-.385-.134-.991zm-1.239.821.634.774zm-.687.473.304.953zm-.701-.035-.398.917zm-1.53-1.431-.708.707zm-.539-.638-.917.398zm-.035-.7-.952-.305zm.472-.69-.774-.633zm.822-1.238.991.134zm-.385-.928.607-.795zm-1.457-.295-.099.995zm-.819-.153-.458.89zm-.472-.52-.93.368zM2 12.632H1zm0-1.264H1zm.07-.83-.93-.369zm.471-.521-.459-.89v.001zm.82-.154-.1-.995zm1.457-.295.607.795zm.385-.927.991-.133zM4.381 7.4l-.774.634zm-.472-.687-.952.304zm.035-.701-.917-.398zm2.069-2.069-.398-.917zm.7-.035.305-.952zm.69.472-.634.774zm1.238.821-.134.991zm.927-.385.795.607zm.295-1.456.995.1zm.154-.82-.889-.459zm.52-.47-.368-.93zM12.632 2v1c.23 0 .355 0 .445.007.08.005.065.012.018-.007l.368-.93.368-.93a2 2 0 0 0-.62-.129C13.04 1 12.837 1 12.631 1zm.83.07-.367.93.888-.458.89-.458a2 2 0 0 0-1.042-.943zm.521.472L13.094 3c-.022-.044-.017-.06-.004.018.015.09.028.213.05.443l.996-.1.995-.099a9 9 0 0 0-.069-.575 2 2 0 0 0-.19-.603zm.153.82-.995.099c.039.393.074.748.124 1.03.05.271.135.626.37.934l.796-.607.795-.606c.063.083.043.12.008-.076a13 13 0 0 1-.103-.874zm.295 1.456-.795.607a2 2 0 0 0 1.857.77l-.134-.992-.133-.991zm.928.385.134.991c.385-.052.697-.242.923-.4.234-.163.509-.389.815-.64l-.633-.773-.633-.774c-.333.272-.537.438-.692.546-.163.114-.151.073-.047.06zm1.239-.822.633.774a8 8 0 0 1 .348-.277c.066-.046.058-.031.011-.016l-.304-.953-.304-.952c-.408.13-.748.43-1.018.65zm.688-.472.304.953.397-.918.398-.917a2 2 0 0 0-1.403-.07zm.701.035-.397.918c-.046-.02-.052-.036.008.017.068.06.157.147.32.31l.707-.707.707-.707c-.145-.145-.288-.288-.418-.402a2 2 0 0 0-.53-.346zm.638.538-.707.708.893.892.707-.707.707-.707-.893-.893zm.893.893-.707.707c.163.163.25.252.31.32.053.06.037.054.017.008l.918-.397.917-.398a2 2 0 0 0-.346-.529 9 9 0 0 0-.402-.418zm.538.638-.918.397.953.304.953.304a2 2 0 0 0-.07-1.403zm.035.7-.953-.304c.016-.048.031-.057-.016.01-.052.073-.131.17-.278.349l.774.633.774.634c.13-.158.258-.315.358-.455.106-.148.22-.332.293-.562zm-.473.688-.774-.633c-.25.306-.476.581-.64.816-.157.227-.346.538-.398.921l.99.135.992.134c-.014.103-.054.114.06-.049.107-.155.272-.358.544-.69zm-.821 1.239-.991-.134a2 2 0 0 0 .77 1.857l.606-.795.606-.795zm.385.928-.607.796c.308.235.663.32.935.37.28.05.635.085 1.03.124l.099-.995.1-.995a13 13 0 0 1-.875-.103c-.196-.035-.159-.055-.076.008zm1.457.295-.1.995c.23.023.353.036.442.051.079.014.063.019.02-.004l.458-.888.459-.889c-.38-.196-.834-.225-1.18-.26zm.82.154-.459.888.93-.368.93-.368a2 2 0 0 0-.942-1.04zm.47.52-.93.368c-.017-.046-.011-.062-.006.018.006.09.007.214.007.445h2c0-.205 0-.407-.011-.58a2 2 0 0 0-.13-.619zm.071.831h-1v1.264h2v-1.264zm0 1.264h-1c0 .23 0 .355-.007.445-.005.08-.012.065.007.018l.93.368.93.367a2 2 0 0 0 .129-.619c.011-.172.011-.374.011-.58zm-.07.83-.93-.367.458.888.458.89a2 2 0 0 0 .944-1.042zm-.472.521L21 13.094c.044-.022.06-.017-.018-.004a8 8 0 0 1-.443.05l.1.996.099.995c.204-.02.405-.04.575-.069.18-.03.39-.08.603-.19zm-.82.153-.099-.995c-.394.039-.748.074-1.029.124-.272.05-.626.136-.934.37l.607.796.606.795c-.083.063-.12.043.076.008.185-.034.446-.06.873-.103zm-1.455.295-.607-.796a2 2 0 0 0-.77 1.858l.992-.134.99-.133zm-.385.928-.991.134c.052.384.241.695.399.922.163.235.389.51.64.816l.773-.633.774-.634a13 13 0 0 1-.545-.69c-.113-.163-.073-.151-.06-.048zm.821 1.239-.774.633c.146.179.225.275.277.349.047.065.032.057.017.01l.952-.306.952-.305a2 2 0 0 0-.292-.56c-.1-.14-.229-.297-.358-.455zm.472.686-.953.305.918.397.917.398a2 2 0 0 0 .07-1.404zm-.035.702-.918-.397c.02-.046.036-.052-.017.008a8 8 0 0 1-.31.32l.707.707.707.707c.145-.145.288-.288.402-.418.12-.137.25-.309.346-.529zm-.538.638-.707-.707-.893.892.707.708.707.707.893-.893zm-.893.893-.707-.707a8 8 0 0 1-.32.31c-.06.053-.054.037-.008.017l.397.918.398.917c.22-.095.391-.226.53-.346.13-.114.272-.257.417-.402zm-.638.538-.397-.918-.304.953-.304.953c.461.147.96.121 1.403-.07zm-.7.035.303-.953c.047.015.055.03-.01-.017a8 8 0 0 1-.35-.276l-.632.774-.633.774c.269.22.61.52 1.017.65zm-.69-.472.634-.774c-.306-.25-.582-.477-.816-.64-.227-.157-.539-.348-.924-.4l-.133.992-.133.991c-.104-.014-.115-.054.048.06.155.107.359.273.691.545zm-1.239-.822.133-.991a2 2 0 0 0-1.855.769l.795.607.795.606zm-.927.385-.795-.607c-.236.308-.322.663-.37.935-.051.281-.086.636-.125 1.03l.995.099.995.099c.043-.427.07-.689.103-.874.035-.195.055-.159-.008-.076zm-.295 1.457-.995-.1c-.023.23-.036.354-.051.444-.014.079-.018.062.005.018l.888.458.89.458c.11-.214.16-.424.19-.604.028-.17.047-.371.068-.575zm-.153.82L13.095 21l.368.93.368.93a2 2 0 0 0 1.041-.944zm-.52.472-.368-.93c.046-.019.063-.012-.018-.007-.09.006-.215.007-.446.007v2c.205 0 .407 0 .58-.011.182-.012.396-.04.62-.13zm-.832.07v-1h-1.263v2h1.263zm-1.263 0v-1c-.23 0-.355 0-.445-.007-.08-.005-.064-.011-.018.007l-.368.93-.368.93c.224.088.437.117.62.129.172.011.374.011.58.011zm-.83-.07.367-.93-.888.459-.889.459a2 2 0 0 0 1.041.942zm-.521-.471.888-.459c.023.044.018.06.004-.02a8 8 0 0 1-.05-.44l-.996.099-.995.1c.035.345.064.798.26 1.179zm-.154-.82.995-.1c-.04-.394-.074-.748-.124-1.03-.05-.27-.135-.626-.37-.934l-.796.607-.795.606c-.063-.083-.043-.12-.008.076.034.185.06.447.103.874zm-.295-1.457.795-.607a2 2 0 0 0-1.857-.77l.134.992.133.99v.001zm-.928-.385-.135-.991c-.383.052-.694.241-.921.399-.235.163-.51.389-.816.64l.633.773.634.774c.332-.272.535-.437.69-.545.163-.113.152-.073.049-.06zm-1.239.821-.633-.774c-.18.147-.276.226-.35.278-.066.047-.057.032-.009.016l.305.953.304.952c.23-.073.414-.187.562-.293.14-.1.297-.229.455-.358zm-.687.473-.304-.953-.397.918-.398.917a2 2 0 0 0 1.403.07zm-.701-.035.397-.918c.046.02.052.036-.008-.017a8 8 0 0 1-.32-.31l-.707.707-.707.707c.145.145.288.288.418.402.138.12.309.25.53.346zm-.638-.538.707-.707-.892-.893-.708.707-.707.707.893.893zm-.893-.893.708-.707a8 8 0 0 1-.31-.32c-.054-.06-.038-.054-.018-.008l-.918.397-.917.398c.095.22.226.391.346.53.114.13.257.272.402.417zm-.538-.638.918-.397-.953-.304-.953-.304a2 2 0 0 0 .07 1.403zm-.035-.7.953.303c-.015.047-.03.055.016-.01.052-.074.13-.17.277-.35l-.774-.632-.774-.633c-.22.269-.52.61-.65 1.017zm.472-.69.774.634c.25-.306.476-.581.64-.815.157-.226.347-.538.4-.923l-.992-.134-.99-.133c.013-.104.054-.116-.06.047a13 13 0 0 1-.546.691zm.822-1.238.991.134a2 2 0 0 0-.769-1.857l-.607.795-.606.795zm-.385-.928.607-.795c-.308-.236-.663-.322-.935-.37-.281-.051-.636-.086-1.03-.125l-.099.995-.099.995c.427.042.688.07.874.103.195.035.159.055.076-.008zm-1.457-.295.1-.995a8 8 0 0 1-.443-.051c-.079-.013-.062-.018-.018.005l-.458.888-.458.89c.213.11.423.159.603.19.17.028.371.047.575.068zm-.819-.153L3 13.095l-.93.368-.93.368a2 2 0 0 0 .944 1.041zm-.472-.52.93-.368c.019.046.012.062.007-.018A8 8 0 0 1 3 12.632H1c0 .205 0 .407.011.58.012.182.041.395.13.619zM2 12.632h1v-1.264H1v1.264zm0-1.264h1c0-.23 0-.355.007-.445.005-.08.012-.064-.007-.018l-.93-.368-.93-.368a2 2 0 0 0-.129.62C1 10.96 1 11.163 1 11.369zm.07-.83.93.367-.459-.888-.459-.889a2 2 0 0 0-.942 1.041zm.471-.521.459.888c-.044.023-.06.018.02.004a8 8 0 0 1 .44-.05l-.099-.996-.1-.995c-.345.035-.798.064-1.179.26zm.82-.154.1.995c.394-.04.748-.074 1.03-.124.27-.05.626-.135.934-.37l-.607-.796-.606-.795c.083-.063.12-.043-.076-.008-.185.034-.447.06-.874.103zm1.457-.295.607.795a2 2 0 0 0 .77-1.855l-.992.133-.991.133zm.385-.927.991-.134c-.052-.384-.242-.696-.4-.923-.162-.234-.389-.51-.64-.816l-.773.633-.774.634c.272.332.438.536.546.691.113.163.073.152.06.048zM4.381 7.4l.774-.633a8 8 0 0 1-.277-.349c-.046-.065-.031-.057-.016-.01l-.953.305-.952.304c.073.229.186.412.292.561.1.14.228.297.358.456zm-.472-.687.953-.304-.918-.397-.917-.398a2 2 0 0 0-.07 1.403zm.035-.701.918.397c-.02.046-.036.052.017-.008a8 8 0 0 1 .31-.32l-.707-.707-.707-.707c-.145.145-.288.288-.402.418-.12.138-.25.309-.346.53zm.538-.638.708.707.892-.892-.707-.708-.707-.707-.893.893zm.893-.893.707.708c.163-.164.252-.251.32-.31.06-.054.054-.038.008-.018l-.397-.918-.398-.917c-.22.095-.391.226-.53.346-.13.114-.272.257-.417.402zm.638-.538.397.918.304-.953.304-.953a2 2 0 0 0-1.403.07zm.7-.035-.303.953c-.047-.015-.055-.03.01.017.074.052.17.13.35.276l.632-.774.633-.774c-.269-.22-.61-.52-1.017-.65zm.69.472-.634.774c.306.25.581.476.816.64.226.157.538.347.922.398l.134-.99.133-.992c.103.014.115.054-.048-.059a13 13 0 0 1-.69-.545zm1.238.821-.133.991a2 2 0 0 0 1.855-.769l-.795-.607-.795-.606zm.927-.385.796.607c.234-.308.32-.663.37-.934.05-.281.085-.636.124-1.03l-.995-.099-.995-.1a14 14 0 0 1-.103.875c-.035.194-.055.158.008.075zm.295-1.456.995.1c.023-.23.036-.353.051-.442.014-.079.019-.063-.004-.02l-.888-.458-.89-.459c-.195.38-.224.834-.259 1.18zm.154-.82.888.46-.368-.93-.368-.93a2 2 0 0 0-1.04.941zm.52-.47.368.93c-.046.018-.062.011.018.006.09-.006.214-.007.445-.007V1c-.205 0-.407 0-.58.011a2 2 0 0 0-.619.13zm.831-.07v1h1.264V1h-1.264zM12 8V7a5 5 0 0 0-5 5h2a3 3 0 0 1 3-3zm-4 4H7a5 5 0 0 0 5 5v-2a3 3 0 0 1-3-3zm4 4v1a5 5 0 0 0 5-5h-2a3 3 0 0 1-3 3zm4-4h1a5 5 0 0 0-5-5v2a3 3 0 0 1 3 3z"
                      fill="#fff"
                    />
                  </Svg>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.membersButton}
                onPress={openMembersDrawer}
                activeOpacity={0.7}
              >
                {/* Settings Button */}
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <Circle cx="9" cy="7" r="4"/>
                  <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.groupImageContainer}>
              {group.groupImage ? (
                <Image 
                  source={{ uri: group.groupImage }} 
                  style={styles.groupImageLarge} 
                />
              ) : (
                <View style={styles.groupImagePlaceholder}>
                  <Text style={styles.groupEmojiLarge}>👥</Text>
                </View>
              )}
            </View>
            <View style={styles.headerTextContent}>
              <Text style={styles.headerTitle}>{group.name}</Text>
              {group.description ? (
                <Text style={styles.headerSubtitle}>{group.description}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Group Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.memberCount}</Text>
              <Text style={styles.statLabel}>Member</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalTransactions}</Text>
              <Text style={styles.statLabel}>Total transactions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{optimizedDebts.length}</Text>
              <Text style={styles.statLabel}>Simplified debts</Text>
            </View>
          </View>
        </View>

        {/* Pending Settlement Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.settlementRequestHeader}>
              <Text style={styles.sectionTitle}>⏳ Pending Approval</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingRequests.length}</Text>
              </View>
            </View>
            {pendingRequests.map((request) => {
              const fromUser = StaticDB.getUserById(request.fromUserId);
              return (
                <View key={request.id} style={styles.settlementRequestCard}>
                  <View style={styles.settlementRequestInfo}>
                    <Text style={styles.settlementRequestTitle}>
                      💸 {fromUser?.name} ingin melunasi
                    </Text>
                    <Text style={styles.settlementRequestAmount}>
                      {formatCurrency(request.amount)}
                    </Text>
                    <Text style={styles.settlementRequestDescription}>
                      {request.description}
                    </Text>
                    <Text style={styles.settlementRequestDate}>
                      {new Date(request.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.settlementRequestActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApproveSettlement(request.id, request.amount)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.approveButtonText}>✓ Terima</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectSettlement(request.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rejectButtonText}>✕ Tolak</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* My Actions in this Group */}
        {(myOptimizedDebts.shouldPay.length > 0 ||
          myOptimizedDebts.willReceive.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}></Text>

            {myOptimizedDebts.shouldPay.length > 0 ? (
              <View style={styles.actionSection}>
                <Text style={styles.actionLabel}>You must paid to:</Text>
                {myOptimizedDebts.shouldPay.map((debt, index) => (
                  <View key={index} style={[styles.debtCard, styles.payCard]}>
                    <View style={styles.debtHeader}>
                      <View style={styles.debtInfo}>
                        <Text style={styles.debtName}>{debt.toName}</Text>
                        <Text style={styles.debtAmount}>
                          {formatCurrency(debt.amount)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handlePayDebt(debt)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.payButtonText}>Pay now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {myOptimizedDebts.willReceive.length > 0 ? (
              <View style={styles.actionSection}>
                <Text style={styles.actionLabel}>Nominal yang diterima:</Text>
                {myOptimizedDebts.willReceive.map((debt, index) => (
                  <View
                    key={index}
                    style={[styles.debtCard, styles.receiveCard]}
                  >
                    <View style={styles.debtHeader}>
                      <Text style={styles.debtName}>{debt.fromName}</Text>
                      <Text style={styles.debtAmount}>
                        {formatCurrency(debt.amount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Simplified Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Simplifikasi Hutang</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{optimizedDebts.length} pembayaran</Text>
            </View>
          </View>

          {optimizedDebts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No debt yet, start now!</Text>
            </View>
          ) : (
            <View style={styles.simplificationList}>
              {optimizedDebts.map((debt, index) => {
                const isUserInvolved = user && (debt.from === user.id || debt.to === user.id);
                const canUserPay = user && debt.from === user.id;
                
                return (
                  <View key={index} style={styles.simplificationItem}>
                    <View style={styles.simplificationRow}>
                      <Text style={styles.simplificationFromName}>{debt.fromName}</Text>
                      <Text style={styles.simplificationArrow}>→</Text>
                      <Text style={styles.simplificationToName}>{debt.toName}</Text>
                      <Text style={styles.simplificationEquals}>=</Text>
                      <Text style={styles.simplificationAmount}>
                        {formatCurrency(debt.amount).replace('Rp', '').trim()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* All Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{transactions.length} transcation</Text>
            </View>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Start your transaction!</Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction, index, sortedTransactions) => {
                const fromUser = StaticDB.getUserById(transaction.fromUserId);
                const toUser = StaticDB.getUserById(transaction.toUserId);
                const creator = StaticDB.getUserById(transaction.createdBy);
                
                // Group by date (only date part, not time)
                const currentDate = transaction.date.split('T')[0];
                const previousDate = index > 0 ? sortedTransactions[index - 1].date.split('T')[0] : null;
                const showDateHeader = currentDate !== previousDate;

                // Format date: "Today", "Yesterday", "Aug 8" or "Jun 9, 2025"
                const formatDateHeader = (dateString: string) => {
                  const date = new Date(dateString);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dateOnly = new Date(date);
                  dateOnly.setHours(0, 0, 0, 0);
                  
                  const diffTime = today.getTime() - dateOnly.getTime();
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays === 0) return 'Today';
                  if (diffDays === 1) return 'Yesterday';
                  
                  const showYear = date.getFullYear() !== today.getFullYear();
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const month = monthNames[date.getMonth()];
                  const day = date.getDate();
                  const year = date.getFullYear();
                  
                  return showYear ? `${month} ${day}, ${year}` : `${month} ${day}`;
                };

                // Determine transaction type for current user
                const isUserOwes = user && transaction.fromUserId === user.id; // User berhutang (merah) - bottom left arrow
                const isUserReceives = user && transaction.toUserId === user.id; // User menerima (hijau) - top right arrow
                const isOthersTransaction = user && transaction.fromUserId !== user.id && transaction.toUserId !== user.id; // Hutang orang lain (kuning) - right arrow

                // Set icon style and arrow direction based on transaction type
                const iconBackgroundColor = isUserOwes ? '#fee2e2' : isUserReceives ? '#d1fae5' : '#fef3c7';
                const iconColor = isUserOwes ? '#dc2626' : isUserReceives ? '#10b981' : '#f59e0b';

                // Select appropriate arrow component
                const ArrowComponent = isUserOwes ? BottomLeftArrow : isUserReceives ? TopRightArrow : RightArrow;

                return (
                  <View key={transaction.id}>
                    {showDateHeader ? (
                      <Text style={styles.transactionDateHeader}>{formatDateHeader(currentDate)}</Text>
                    ) : null}
                    <TouchableOpacity 
                      style={styles.transactionListItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionIconContainer}>
                        <View style={[
                          isOthersTransaction ? styles.transactionIcon : 
                          isUserOwes ? styles.transactionIconOwes : 
                          styles.transactionIconReceives,
                          { backgroundColor: iconBackgroundColor }
                        ]}>
                          <ArrowComponent color={iconColor} size={20} />
                        </View>
                      </View>
                      <View style={styles.transactionListContent}>
                        <View style={styles.transactionListLeft}>
                          <Text style={styles.transactionListAmount}>
                            {formatCurrency(transaction.amount)}
                          </Text>
                          <Text style={styles.transactionListUsers}>
                            {fromUser?.name || 'Unknown'} → {toUser?.name || 'Unknown'}
                          </Text>
                          {transaction.description ? (
                            <Text style={styles.transactionListDescription}>
                              {transaction.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Members Slide-in Drawer */}
      <Modal
        visible={showMembersDrawer}
        transparent
        animationType="none"
        onRequestClose={closeMembersDrawer}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={closeMembersDrawer}
        >
          <Animated.View
            style={[
              styles.drawerContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Member List</Text>
                <TouchableOpacity onPress={closeMembersDrawer}>
                  <Text style={styles.drawerClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.drawerContent}
                contentContainerStyle={styles.drawerContentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Creator Section */}
                {(() => {
                  const creator = StaticDB.getUserById(group.creatorId);
                  if (!creator) return null;
                  return (
                    <View>
                      <View style={styles.roleHeader}>
                        <Text style={styles.roleTitle}>CREATOR — 1</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.memberItem}
                        activeOpacity={0.7}
                      >
                        <View style={styles.memberAvatarContainer}>
                          {creator.profileImage ? (
                            <Image 
                              source={{ uri: creator.profileImage }} 
                              style={styles.memberAvatar} 
                            />
                          ) : (
                            <View style={styles.memberAvatar}>
                              <Text style={styles.memberAvatarText}>
                                {creator.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.memberTextContainer}>
                          <Text style={styles.memberName}>
                            {creator.name}
                            {creator.id === user.id && (
                              <Text style={styles.youIndicator}> (You)</Text>
                            )}
                          </Text>
                          <Text style={styles.memberUsername}>@{creator.username}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })()}

                {/* Members Section */}
                {(() => {
                  const members = group?.memberIds
                    .filter(id => id !== group.creatorId)
                    .map(id => StaticDB.getUserById(id))
                    .filter(m => m !== undefined);
                  
                  if (!members || members.length === 0) return null;
                  
                  return (
                    <View style={styles.roleSection}>
                      <View style={styles.roleHeader}>
                        <Text style={styles.roleTitle}>MEMBERS — {members.length}</Text>
                      </View>
                      {members.map(member => (
                        <TouchableOpacity 
                          key={member.id}
                          style={styles.memberItem}
                          activeOpacity={0.7}
                        >
                          <View style={styles.memberAvatarContainer}>
                            {member.profileImage ? (
                              <Image 
                                source={{ uri: member.profileImage }} 
                                style={styles.memberAvatar} 
                              />
                            ) : (
                              <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>
                                  {member.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.memberTextContainer}>
                            <Text style={styles.memberName}>
                              {member.name}
                              {member.id === user.id && (
                                <Text style={styles.youIndicator}> (You)</Text>
                              )}
                            </Text>
                            <Text style={styles.memberUsername}>@{member.username}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })()}

                {/* Add Member Button - Only for creator */}
                {user && group.creatorId === user.id ? (
                  <TouchableOpacity
                    style={styles.addMemberButton}
                    onPress={() => {
                      closeMembersDrawer();
                      setTimeout(() => setShowAddMemberModal(true), 300);
                    }}
                  >
                    <Text style={styles.addMemberButtonText}>+ Invite to Group</Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Invite to {group.name}</Text>
            
            <Text style={styles.deleteModalInstruction}>
              Enter the username of the member you want to add:
            </Text>

            <TextInput
              style={styles.deleteModalInput}
              value={newMemberUsername}
              onChangeText={(text) => {
                setNewMemberUsername(text);
                setAddMemberError('');
              }}
              placeholder="e.g., Supri"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {addMemberError ? (
              <Text style={styles.errorText}>{addMemberError}</Text>
            ) : null}

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowAddMemberModal(false);
                  setNewMemberUsername('');
                  setAddMemberError('');
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalConfirmButton, { backgroundColor: '#10b981' }]}
                onPress={handleAddMember}
              >
                <Text style={styles.deleteModalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity 
          style={styles.deleteModalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <ScrollView 
              contentContainerStyle={styles.editModalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.editModalContainer}>
            <Text style={styles.deleteModalTitle}>Edit Group</Text>
            
            {/* Group Image */}
            <TouchableOpacity
              style={styles.editImageContainer}
              onPress={handlePickGroupImage}
              activeOpacity={0.7}
            >
              {editGroupImage ? (
                <Image source={{ uri: editGroupImage }} style={styles.editGroupImage} />
              ) : (
                <View style={styles.editImagePlaceholder}>
                  <Text style={styles.editPlaceholderEmoji}>👥</Text>
                  <Text style={styles.editPlaceholderText}>Tap to change</Text>
                </View>
              )}
            </TouchableOpacity>

            {editGroupImage ? (
              <TouchableOpacity
                onPress={() => setEditGroupImage(null)}
                style={styles.removeEditImageButton}
                activeOpacity={0.7}
              >
                <Text style={styles.removeEditImageText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.editModalLabel}>Group name</Text>
            <TextInput
              style={styles.deleteModalInput}
              value={editGroupName}
              onChangeText={setEditGroupName}
              placeholder="New name"
              placeholderTextColor="#999"
            />
            <Text style={styles.editModalLabel}>Description</Text>
            <TextInput
              style={[styles.deleteModalInput, styles.editModalTextArea]}
              value={editGroupDescription}
              onChangeText={setEditGroupDescription}
              placeholder="Deskripsi grup (opsional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalConfirmButton, { backgroundColor: '#2563eb' }]}
                onPress={handleSaveGroupEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteModalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Danger Zone - Delete Group */}
              <TouchableOpacity
                style={styles.editDeleteButton}
                onPress={() => {
                  setShowEditModal(false);
                  setTimeout(() => handleDeleteGroup(), 300);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.editDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Approval Confirmation Modal */}
      <Modal
        visible={showApprovalConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowApprovalConfirm(false);
          setPendingApproval(null);
        }}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Confirm Approval</Text>
            
            {pendingApproval && (
              <View style={styles.paymentSummary}>
                <Text style={styles.deleteModalWarning}>
                  Are you sure you want to approve this settlement?
                </Text>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Amount:</Text>
                  <Text style={[styles.paymentValue, styles.paymentAmount]}>
                    {formatCurrency(pendingApproval.amount)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowApprovalConfirm(false);
                  setPendingApproval(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalConfirmButton, { backgroundColor: '#10b981' }]}
                onPress={confirmApproveSettlement}
              >
                <Text style={styles.deleteModalConfirmText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        visible={showRejectConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRejectConfirm(false);
          setPendingReject(null);
        }}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Reject Settlement</Text>
            
            <Text style={styles.deleteModalWarning}>
              Are you sure you want to reject this settlement request?
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowRejectConfirm(false);
                  setPendingReject(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={confirmRejectSettlement}
              >
                <Text style={styles.deleteModalConfirmText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Delete Group</Text>
            
            <Text style={styles.deleteModalWarning}>
              This will permanently delete the group and all its transactions.
            </Text>

            <Text style={styles.deleteModalInstruction}>
              To confirm, type "<Text style={styles.deleteModalGroupName}>{group?.name}</Text>" in the box below:
            </Text>

            <TextInput
              style={styles.deleteModalInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type group name here"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteModalConfirmButton,
                  deleteConfirmText.trim() !== group?.name && styles.deleteModalConfirmButtonDisabled
                ]}
                onPress={confirmDelete}
                disabled={deleteConfirmText.trim() !== group?.name}
              >
                <Text style={styles.deleteModalConfirmText}>Delete this group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPaymentModal(false);
          setSelectedDebt(null);
          setPaymentDescription('');
        }}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Payment Confirmation</Text>
            
            {selectedDebt && (
              <>
                <View style={styles.paymentSummary}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>From:</Text>
                    <Text style={styles.paymentValue}>{selectedDebt.fromName}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>To:</Text>
                    <Text style={styles.paymentValue}>{selectedDebt.toName}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Amount:</Text>
                    <Text style={[styles.paymentValue, styles.paymentAmount]}>
                      {formatCurrency(selectedDebt.amount)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.editModalLabel}>Catatan (opsional):</Text>
                <TextInput
                  style={styles.deleteModalInput}
                  value={paymentDescription}
                  onChangeText={setPaymentDescription}
                  placeholder="Contoh: Transfer BCA, Tunai, dll"
                  placeholderTextColor="#999"
                  multiline
                />

                <Text style={styles.paymentNote}>
                  Pembayaran ini akan dicatat sebagai transaksi settlement dan akan menyeimbangkan hutang yang ada.
                </Text>
              </>
            )}

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  setShowPaymentModal(false);
                  setSelectedDebt(null);
                  setPaymentDescription('');
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalConfirmButton, { backgroundColor: '#10b981' }]}
                onPress={confirmPayment}
              >
                <Text style={styles.deleteModalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Transaction Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleAddTransaction}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Toast Notification */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#344170',
    padding: 20,
    paddingTop: 35,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
  },

  membersButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 8,
    fontFamily: Font.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    fontFamily: Font.regular,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    color: '#344170',
    marginBottom: 4,
    fontFamily: Font.bold,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: Font.regular,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: Font.bold,
  },
  badge: {
    backgroundColor: '#e8ebf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#344170',
    fontFamily: Font.semiBold,
  },
  actionSection: {
    marginBottom: 16,
  },
  actionLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontFamily: Font.semiBold,
  },
  debtCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  payCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  receiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
     
    color: '#333',
    fontFamily: Font.semiBold,
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 18,
    color: '#344170',
    fontFamily: Font.bold,
  },
  payButton: {
    backgroundColor: '#0e9266ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
payButtonPressed: {
  backgroundColor: '#0c7a54',
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
  transform: [{ scale: 0.98 }],
},
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Font.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    fontFamily: Font.regular,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    fontFamily: Font.semiBold,
  },
  simplificationList: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  simplificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  simplificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  quickPayButton: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
    alignSelf: 'flex-start',
  },
  quickPayButtonText: {
    color: '#10b981',
    fontSize: 13,
    fontFamily: Font.semiBold,
  },
  simplificationFromName: {
    fontSize: 16,
    color: '#333',
    minWidth: 80,
    fontFamily: Font.semiBold,
  },
  simplificationArrow: {
    fontSize: 18,
    color: '#54638d',
    fontFamily: Font.bold,
  },
  simplificationToName: {
    fontSize: 16,
    color: '#333',
    minWidth: 80,
    fontFamily: Font.semiBold,
  },
  simplificationEquals: {
    fontSize: 18,
    color: '#666',
    fontFamily: Font.bold,
  },
  simplificationAmount: {
    fontSize: 18,
    color: '#10b981',
    flex: 1,
    textAlign: 'right',
    fontFamily: Font.bold,
  },
  transactionList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionDateHeader: {
    fontSize: 13,
     
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    fontFamily: Font.semiBold,
  },
  transactionListItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionIconContainer: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 3,
    paddingLeft: 0,
  },
  transactionIconOwes: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
    paddingLeft: 4,
  },
  transactionIconReceives: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    paddingRight: 4,
  },
  transactionIconText: {
    fontSize: 18,
    color: '#10b981',
     
    fontFamily: Font.bold,
  },
  transactionListContent: {
    flex: 1,
  },
  transactionListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionListLeft: {
    flex: 1,
  },
  transactionListAmount: {
    fontSize: 16,
     
    color: '#333',
    marginBottom: 2,
    fontFamily: Font.bold,
  },
  transactionListUsers: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontFamily: Font.regular,
  },
  transactionListDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: Font.regular,
  },
  transactionListRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  transactionListTime: {
    fontSize: 13,
    color: '#999',
    fontFamily: Font.regular,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgePaid: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeUnpaid: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
     
    fontFamily: Font.semiBold,
  },
  statusTextPaid: {
    color: '#059669',
  },
  statusTextUnpaid: {
    color: '#dc2626',
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#344170',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 14,
    
    fontFamily: Font.semiBold,
  },
  memberName: {
    fontSize: 15,
    
    color: '#1f2937',
    fontFamily: Font.semiBold,
    marginBottom: 2,
  },
  memberUsername: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: Font.regular,
  },
  youIndicator: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6b7280',
    fontFamily: Font.regular,
  },
  creatorBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  creatorText: {
    fontSize: 11,
    color: '#fff',
    fontFamily: Font.semiBold,
  },
  youBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  youText: {
    fontSize: 11,
    color: '#fff',
    fontFamily: Font.semiBold,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  drawerContainer: {
    width: 200,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingTop: 30,
    backgroundColor: '#000000ff',
  },
  drawerTitle: {
    fontSize: 20,
    color: '#C3D1E6',
    fontFamily: Font.bold,
  },
  drawerClose: {
    fontSize: 28,
    color: '#fff',
    fontFamily: Font.regular,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  drawerContentContainer: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  roleSection: {
    marginTop: 20,
  },
  roleHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  roleTitle: {
    fontSize: 11,
    fontFamily: Font.semiBold,
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  memberAvatarContainer: {
    marginRight: 12,
  },
  memberTextContainer: {
    flex: 1,
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#344170',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: Font.bold,
  },
  dangerZone: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  dangerZoneTitle: {
    fontSize: 16,
     
    color: '#dc2626',
    marginBottom: 8,
    fontFamily: Font.bold,
  },
  dangerZoneDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: Font.regular,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
     
    color: '#fff',
    fontFamily: Font.semiBold,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    width: '85%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    color: '#333',
    padding: 10,
    marginBottom: 16,
    justifyContent: 'center',
    fontFamily: Font.bold,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    lineHeight: 20,
    fontFamily: Font.regular,
  },
  deleteModalInstruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
    fontFamily: Font.regular,
  },
  deleteModalGroupName: {
     
    color: '#333',
  },
  deleteModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
    fontFamily: Font.regular,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 15,
     
    color: '#666',
    fontFamily: Font.semiBold,
  },
  deleteModalConfirmButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalConfirmButtonDisabled: {
    backgroundColor: '#fca5a5',
    opacity: 0.5,
  },
  deleteModalConfirmText: {
    fontSize: 15,
     
    color: '#fff',
    fontFamily: Font.semiBold,
  },
  addMemberButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addMemberButtonText: {
    fontSize: 14,
    
    color: '#fff',
    fontFamily: Font.semiBold,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
    fontFamily: Font.regular,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  groupImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  groupImageLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  groupImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupEmojiLarge: {
    fontSize: 32,
    fontFamily: Font.regular,
  },
  headerTextContent: {
    flex: 1,
  },
  editModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  editModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  editImageContainer: {
    alignItems: 'center',
    marginVertical: 0,
  },
  editGroupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  editPlaceholderEmoji: {
    fontSize: 40,
    marginBottom: 4,
    fontFamily: Font.regular,
  },
  editPlaceholderText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontFamily: Font.regular,
  },
  removeEditImageButton: {
    marginBottom: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 10,
  },
  removeEditImageText: {
    color: '#dc2626',
    fontSize: 13,
    fontFamily: Font.semiBold,
  },
  editModalLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
    fontFamily: Font.semiBold,
  },
  editModalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editDeleteButton: {
    backgroundColor: '#dc2626',
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editDeleteButtonText: {
    fontSize: 15,
    color: '#fff',
    fontFamily: Font.semiBold,
  },
  paymentSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: Font.regular,
  },
  paymentValue: {
    fontSize: 15,
    color: '#333',
    fontFamily: Font.semiBold,
  },
  paymentAmount: {
    fontSize: 18,
    color: '#10b981',
    fontFamily: Font.bold,
  },
  paymentNote: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 18,
    fontFamily: Font.regular,
  },
  // Settlement Request Styles
  settlementRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  pendingBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Font.bold,
  },
  settlementRequestCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
    padding: 16,
    marginBottom: 12,
  },
  settlementRequestInfo: {
    marginBottom: 12,
  },
  settlementRequestTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: Font.semiBold,
    marginBottom: 4,
  },
  settlementRequestAmount: {
    fontSize: 24,
    color: '#10b981',
    fontFamily: Font.bold,
    marginBottom: 4,
  },
  settlementRequestDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: Font.regular,
    marginBottom: 4,
  },
  settlementRequestDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: Font.regular,
  },
  settlementRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Font.semiBold,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Font.semiBold,
  },
  // Celebration Modal Styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  celebrationTitle: {
    fontSize: 24,
    color: '#333',
    fontFamily: Font.bold,
    marginBottom: 16,
    textAlign: 'center',
  },
  celebrationAmount: {
    fontSize: 36,
    color: '#10b981',
    fontFamily: Font.bold,
    marginBottom: 8,
  },
  celebrationMessage: {
    fontSize: 16,
    color: '#666',
    fontFamily: Font.regular,
    marginBottom: 24,
    textAlign: 'center',
  },
  graphContainer: {
    width: '100%',
    marginTop: 16,
  },
  graphBar: {
    height: 40,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  graphFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  graphLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: Font.semiBold,
    textAlign: 'center',
  },
});