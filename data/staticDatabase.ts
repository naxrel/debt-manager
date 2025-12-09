// Static Database untuk Demo
// Database ini berisi user dan data utang piutang yang sudah terdaftar

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  profileImage?: string; // URI/URL gambar profile
}

export interface Debt {
  id: string;
  userId: string; // ID user yang memiliki data ini
  type: 'hutang' | 'piutang'; // hutang = kita yang berhutang, piutang = orang yang berhutang ke kita
  name: string; // Nama orang yang terlibat
  otherUserId?: string; // ID user lawan (jika menggunakan @username)
  amount: number;
  description: string;
  date: string;
  isPaid: boolean;
  groupId?: string; // Optional: ID grup jika debt ini bagian dari grup
  status: 'pending' | 'confirmed' | 'rejected'; // Status approval
  initiatedBy: string; // User yang create transaksi
  approvedBy?: string; // User yang approve
  approvedAt?: string; // Timestamp approval
  rejectionReason?: string; // Alasan reject
}

export interface DebtGroup {
  id: string;
  name: string;
  description: string;
  creatorId: string; // User yang membuat grup
  memberIds: string[]; // Array of user IDs yang jadi member
  createdAt: string;
  isActive: boolean;
  groupImage?: string; // URI/URL gambar profil grup (opsional, default emoji 👥)
}

export interface GroupTransaction {
  id: string;
  groupId: string;
  fromUserId: string; // User yang berhutang
  toUserId: string; // User yang dibayar
  amount: number;
  description: string;
  date: string;
  isPaid: boolean;
  createdBy: string; // User yang menginput transaksi ini
}

export interface SettlementRequest {
  id: string;
  groupId: string;
  fromUserId: string; // User yang membayar (penghutang)
  toUserId: string; // User yang menerima (pemberi hutang)
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// Database Users (Static)
export const STATIC_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@example.com',
  },
  {
    id: '2',
    username: 'john',
    password: 'john123',
    name: 'John Doe',
    email: 'john@example.com',
  },
  {
    id: '3',
    username: 'jane',
    password: 'jane123',
    name: 'Jane Smith',
    email: 'jane@example.com',
  },
  {
    id: '4',
    username: 'dong',
    password: 'dong123',
    name: 'Dongs',
    email: 'Dongs@example.com',
  }
];

// Database Debts (Static)
export const STATIC_DEBTS: Debt[] = [
  // Debts untuk user 'admin'
  {
    id: 'd1',
    userId: '1',
    type: 'piutang',
    name: 'Budi',
    amount: 500000,
    description: 'Pinjaman untuk modal usaha',
    date: '2025-11-01',
    isPaid: false,
    status: 'confirmed',
    initiatedBy: '1',
  },
  {
    id: 'd2',
    userId: '1',
    type: 'hutang',
    name: 'Siti',
    amount: 300000,
    description: 'Hutang untuk kebutuhan darurat',
    date: '2025-11-05',
    isPaid: false,
    status: 'confirmed',
    initiatedBy: '1',
  },
  {
    id: 'd3',
    userId: '1',
    type: 'piutang',
    name: 'Andi',
    amount: 750000,
    description: 'Pinjaman untuk renovasi rumah',
    date: '2025-10-20',
    isPaid: true,
    status: 'confirmed',
    initiatedBy: '1',
  },
  // Debts untuk user 'john'
  {
    id: 'd4',
    userId: '2',
    type: 'hutang',
    name: 'Michael',
    amount: 1000000,
    description: 'Pinjaman untuk beli motor',
    date: '2025-11-10',
    isPaid: false,
    status: 'confirmed',
    initiatedBy: '2',
  },
  {
    id: 'd5',
    userId: '2',
    type: 'piutang',
    name: 'Sarah',
    amount: 250000,
    description: 'Pinjaman untuk bayar kuliah',
    date: '2025-11-15',
    isPaid: false,
    status: 'confirmed',
    initiatedBy: '2',
  },
  // Debts untuk user 'jane'
  {
    id: 'd6',
    userId: '3',
    type: 'piutang',
    name: 'Robert',
    amount: 600000,
    description: 'Pinjaman untuk bisnis online',
    date: '2025-11-08',
    isPaid: false,
    status: 'confirmed',
    initiatedBy: '3',
  },
  {
    id: 'd7',
    userId: '3',
    type: 'hutang',
    name: 'Lisa',
    amount: 450000,
    description: 'Hutang untuk biaya pengobatan',
    date: '2025-10-25',
    isPaid: true,
    status: 'confirmed',
    initiatedBy: '3',
  },
];

// Database Groups (Static)
export const STATIC_GROUPS: DebtGroup[] = [
  {
    id: 'g1',
    name: 'Tim Project A',
    description: 'Grup untuk project development',
    creatorId: '1',
    memberIds: ['1', '2', '3'],
    createdAt: '2025-11-01',
    isActive: true,
  },
  {
    id: 'g2',
    name: 'Liburan Bali',
    description: 'Patungan liburan ke Bali',
    creatorId: '2',
    memberIds: ['1', '2'],
    createdAt: '2025-11-10',
    isActive: true,
  },
];

// Database Group Transactions (Static)
export const STATIC_GROUP_TRANSACTIONS: GroupTransaction[] = [
  // Group 1 transactions - Tim Project A
  {
    id: 'gt1',
    groupId: 'g1',
    fromUserId: '2', // John
    toUserId: '3', // Jane
    amount: 300000,
    description: 'Bayar design UI/UX',
    date: '2025-12-05T10:15:00',
    isPaid: false,
    createdBy: '2',
  },
  {
    id: 'gt2',
    groupId: 'g1',
    fromUserId: '3', // Jane
    toUserId: '1', // Admin
    amount: 150000,
    description: 'Bayar hosting server',
    date: '2025-12-06T14:30:00',
    isPaid: false,
    createdBy: '3',
  },
  {
    id: 'gt3',
    groupId: 'g1',
    fromUserId: '1', // Admin
    toUserId: '2', // John
    amount: 200000,
    description: 'Bayar lisensi software',
    date: '2025-12-07T09:00:00',
    isPaid: false,
    createdBy: '1',
  },
  // Group 2 transactions
  {
    id: 'gt4',
    groupId: 'g2',
    fromUserId: '1',
    toUserId: '2',
    amount: 500000,
    description: 'Tiket pesawat',
    date: '2025-11-12',
    isPaid: false,
    createdBy: '1',
  },
  {
    id: 'gt5',
    groupId: 'g2',
    fromUserId: '2',
    toUserId: '1',
    amount: 300000,
    description: 'Hotel booking',
    date: '2025-11-13',
    createdBy: '2',
    isPaid: false,
  },
];

// Helper functions untuk mengakses database
export class StaticDB {
  private static users: User[] = [...STATIC_USERS];
  private static debts: Debt[] = [...STATIC_DEBTS];
  private static groups: DebtGroup[] = [...STATIC_GROUPS];
  private static groupTransactions: GroupTransaction[] = [...STATIC_GROUP_TRANSACTIONS];
  private static settlementRequests: SettlementRequest[] = [];

  // User operations
  static getUsers(): User[] {
    return this.users;
  }

  static getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  static getUserByUsername(username: string): User | undefined {
    return this.users.find(user => user.username === username);
  }

  static authenticateUser(username: string, password: string): User | null {
    const user = this.users.find(
      u => u.username === username && u.password === password
    );
    return user || null;
  }

  static registerUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      ...user,
      id: `u${Date.now()}`,
    };
    this.users.push(newUser);
    return newUser;
  }

  // Debt operations
  static getDebtsByUserId(userId: string): Debt[] {
    return this.debts.filter(debt => debt.userId === userId);
  }

  static getDebtById(id: string): Debt | undefined {
    return this.debts.find(debt => debt.id === id);
  }

  static addDebt(debt: Omit<Debt, 'id'>): Debt {
    const newDebt: Debt = {
      ...debt,
      id: `d${Date.now()}`,
    };
    this.debts.push(newDebt);
    return newDebt;
  }

  static updateDebt(id: string, updates: Partial<Debt>): Debt | null {
    const index = this.debts.findIndex(debt => debt.id === id);
    if (index === -1) return null;

    this.debts[index] = { ...this.debts[index], ...updates };
    return this.debts[index];
  }

  static deleteDebt(id: string): boolean {
    const index = this.debts.findIndex(debt => debt.id === id);
    if (index === -1) return false;

    this.debts.splice(index, 1);
    return true;
  }

  // User operations
  static updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;

    // Don't allow username or password changes through this method
    const { username, password, ...safeUpdates } = updates;
    this.users[index] = { ...this.users[index], ...safeUpdates };
    return this.users[index];
  }

  // Statistics
  static getDebtStatistics(userId: string) {
    const userDebts = this.getDebtsByUserId(userId);
    
    const hutang = userDebts.filter(d => d.type === 'hutang' && !d.isPaid);
    const piutang = userDebts.filter(d => d.type === 'piutang' && !d.isPaid);
    
    const totalHutang = hutang.reduce((sum, d) => sum + d.amount, 0);
    const totalPiutang = piutang.reduce((sum, d) => sum + d.amount, 0);
    
    return {
      totalHutang,
      totalPiutang,
      countHutang: hutang.length,
      countPiutang: piutang.length,
      balance: totalPiutang - totalHutang,
    };
  }

  // Group operations
  static readonly MAX_GROUP_MEMBERS = 10;

  static getGroups(): DebtGroup[] {
    return this.groups.filter(g => g.isActive);
  }

  static getGroupById(id: string): DebtGroup | undefined {
    return this.groups.find(g => g.id === id);
  }

  static getUserGroups(userId: string): DebtGroup[] {
    return this.groups.filter(
      g => g.isActive && (g.creatorId === userId || g.memberIds.includes(userId))
    );
  }

  static createGroup(
    name: string,
    description: string,
    creatorId: string,
    memberIds: string[],
    groupImage?: string
  ): { success: boolean; group?: DebtGroup; error?: string } {
    // Validate member count
    if (memberIds.length > this.MAX_GROUP_MEMBERS) {
      return {
        success: false,
        error: `Maksimum ${this.MAX_GROUP_MEMBERS} anggota per grup`,
      };
    }

    // Ensure creator is included in members
    const allMemberIds = Array.from(new Set([creatorId, ...memberIds]));

    if (allMemberIds.length > this.MAX_GROUP_MEMBERS) {
      return {
        success: false,
        error: `Maksimum ${this.MAX_GROUP_MEMBERS} anggota per grup`,
      };
    }

    // Validate all members exist
    const invalidMembers = allMemberIds.filter(id => !this.getUserById(id));
    if (invalidMembers.length > 0) {
      return {
        success: false,
        error: 'Beberapa anggota tidak ditemukan',
      };
    }

    const newGroup: DebtGroup = {
      id: `g${Date.now()}`,
      name,
      description,
      creatorId,
      memberIds: allMemberIds,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
      groupImage: groupImage || undefined, // Opsional, default undefined (emoji 👥 di UI)
    };

    this.groups.push(newGroup);
    return { success: true, group: newGroup };
  }

  static updateGroup(
    groupId: string,
    updates: { name?: string; description?: string; groupImage?: string }
  ): { success: boolean; error?: string } {
    const group = this.getGroupById(groupId);
    
    if (!group) {
      return { success: false, error: 'Grup tidak ditemukan' };
    }

    if (updates.name !== undefined) {
      group.name = updates.name;
    }
    if (updates.description !== undefined) {
      group.description = updates.description;
    }
    if (updates.groupImage !== undefined) {
      group.groupImage = updates.groupImage;
    }

    return { success: true };
  }

  static addMemberToGroup(
    groupId: string,
    userId: string
  ): { success: boolean; error?: string } {
    const group = this.getGroupById(groupId);
    if (!group) {
      return { success: false, error: 'Grup tidak ditemukan' };
    }

    if (group.memberIds.includes(userId)) {
      return { success: false, error: 'User sudah menjadi anggota' };
    }

    if (group.memberIds.length >= this.MAX_GROUP_MEMBERS) {
      return {
        success: false,
        error: `Maksimum ${this.MAX_GROUP_MEMBERS} anggota per grup`,
      };
    }

    if (!this.getUserById(userId)) {
      return { success: false, error: 'User tidak ditemukan' };
    }

    group.memberIds.push(userId);
    return { success: true };
  }

  static removeMemberFromGroup(
    groupId: string,
    userId: string
  ): { success: boolean; error?: string } {
    const group = this.getGroupById(groupId);
    if (!group) {
      return { success: false, error: 'Grup tidak ditemukan' };
    }

    if (group.creatorId === userId) {
      return { success: false, error: 'Creator tidak dapat dihapus' };
    }

    const index = group.memberIds.indexOf(userId);
    if (index === -1) {
      return { success: false, error: 'User bukan anggota grup' };
    }

    group.memberIds.splice(index, 1);
    return { success: true };
  }

  static deactivateGroup(groupId: string): boolean {
    const group = this.getGroupById(groupId);
    if (!group) return false;

    group.isActive = false;
    return true;
  }

  static deleteGroup(groupId: string): { success: boolean; error?: string } {
    const groupIndex = this.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return { success: false, error: 'Grup tidak ditemukan' };
    }

    // Delete all group transactions
    this.groupTransactions = this.groupTransactions.filter(
      t => t.groupId !== groupId
    );

    // Delete the group
    this.groups.splice(groupIndex, 1);
    return { success: true };
  }

  // Group transactions
  static getAllGroupTransactions(): GroupTransaction[] {
    return this.groupTransactions;
  }

  static getGroupTransactions(groupId: string): GroupTransaction[] {
    return this.groupTransactions.filter(t => t.groupId === groupId);
  }

  static getGroupTransactionById(id: string): GroupTransaction | undefined {
    return this.groupTransactions.find(t => t.id === id);
  }

  static addGroupTransaction(
    transaction: Omit<GroupTransaction, 'id'>
  ): { success: boolean; transaction?: GroupTransaction; error?: string } {
    const group = this.getGroupById(transaction.groupId);
    if (!group) {
      return { success: false, error: 'Grup tidak ditemukan' };
    }

    // Validate from and to users are group members
    if (!group.memberIds.includes(transaction.fromUserId)) {
      return { success: false, error: 'User pengirim bukan anggota grup' };
    }

    if (!group.memberIds.includes(transaction.toUserId)) {
      return { success: false, error: 'User penerima bukan anggota grup' };
    }

    // Validate createdBy is a group member
    if (!group.memberIds.includes(transaction.createdBy)) {
      return { success: false, error: 'User pembuat transaksi bukan anggota grup' };
    }

    const newTransaction: GroupTransaction = {
      ...transaction,
      id: `gt${Date.now()}`,
    };

    this.groupTransactions.push(newTransaction);
    return { success: true, transaction: newTransaction };
  }

  static updateGroupTransaction(
    id: string,
    updates: Partial<GroupTransaction>
  ): GroupTransaction | null {
    const index = this.groupTransactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.groupTransactions[index] = {
      ...this.groupTransactions[index],
      ...updates,
    };
    return this.groupTransactions[index];
  }

  static deleteGroupTransaction(id: string): boolean {
    const index = this.groupTransactions.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.groupTransactions.splice(index, 1);
    return true;
  }

  static getGroupStatistics(groupId: string) {
    const transactions = this.getGroupTransactions(groupId);
    const unpaidTransactions = transactions.filter(t => !t.isPaid);

    const totalAmount = unpaidTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    return {
      totalTransactions: transactions.length,
      unpaidTransactions: unpaidTransactions.length,
      totalAmount,
      memberCount: this.getGroupById(groupId)?.memberIds.length || 0,
    };
  }

  // Approval operations for personal debts
  static getPendingDebtsForUser(userId: string): Debt[] {
    return this.debts.filter(
      d => d.status === 'pending' && d.otherUserId === userId
    );
  }

  static approveDebt(debtId: string, userId: string): { success: boolean; error?: string } {
    const debt = this.getDebtById(debtId);
    if (!debt) {
      return { success: false, error: 'Debt tidak ditemukan' };
    }

    if (debt.otherUserId !== userId) {
      return { success: false, error: 'Anda tidak berhak approve transaksi ini' };
    }

    if (debt.status !== 'pending') {
      return { success: false, error: 'Transaksi sudah di-approve atau reject' };
    }

    // Get the name of the user who initiated the transaction
    const initiator = this.getUserById(debt.userId);
    if (!initiator) {
      return { success: false, error: 'User pembuat transaksi tidak ditemukan' };
    }

    // Create counterpart debt for the other user
    const counterpartDebt: Debt = {
      id: `d${Date.now()}_counter`,
      userId: debt.otherUserId!,
      type: debt.type === 'hutang' ? 'piutang' : 'hutang',
      name: initiator.name, // Name of the person who created the transaction
      otherUserId: debt.userId,
      amount: debt.amount,
      description: debt.description,
      date: debt.date,
      isPaid: false,
      status: 'confirmed',
      initiatedBy: debt.initiatedBy,
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
    };

    this.debts.push(counterpartDebt);

    // Update original debt to confirmed
    this.updateDebt(debtId, {
      status: 'confirmed',
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
    });

    return { success: true };
  }

  static rejectDebt(debtId: string, userId: string, reason: string): { success: boolean; error?: string } {
    const debt = this.getDebtById(debtId);
    if (!debt) {
      return { success: false, error: 'Debt tidak ditemukan' };
    }

    if (debt.otherUserId !== userId) {
      return { success: false, error: 'Anda tidak berhak reject transaksi ini' };
    }

    if (debt.status !== 'pending') {
      return { success: false, error: 'Transaksi sudah di-approve atau reject' };
    }

    this.updateDebt(debtId, {
      status: 'rejected',
      rejectionReason: reason,
    });

    return { success: true };
  }

  // Settlement Request operations
  static createSettlementRequest(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string
  ): { success: boolean; request?: SettlementRequest; error?: string } {
    const group = this.getGroupById(groupId);
    if (!group) {
      return { success: false, error: 'Grup tidak ditemukan' };
    }

    if (!group.memberIds.includes(fromUserId) || !group.memberIds.includes(toUserId)) {
      return { success: false, error: 'User bukan anggota grup' };
    }

    // Check for duplicate pending request
    const existingPendingRequest = this.settlementRequests.find(
      r => r.status === 'pending' &&
           r.groupId === groupId &&
           r.fromUserId === fromUserId &&
           r.toUserId === toUserId &&
           r.amount === amount
    );

    if (existingPendingRequest) {
      return { success: false, error: 'Request pelunasan dengan nominal yang sama sudah ada dan masih pending. Tunggu approval terlebih dahulu.' };
    }

    const newRequest: SettlementRequest = {
      id: `sr${Date.now()}`,
      groupId,
      fromUserId,
      toUserId,
      amount,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.settlementRequests.push(newRequest);
    return { success: true, request: newRequest };
  }

  static getSettlementRequest(id: string): SettlementRequest | undefined {
    return this.settlementRequests.find(r => r.id === id);
  }

  static getPendingSettlementRequests(userId: string, groupId?: string): SettlementRequest[] {
    return this.settlementRequests.filter(
      r => r.status === 'pending' && 
      r.toUserId === userId && 
      (!groupId || r.groupId === groupId)
    );
  }

  static getMySettlementRequests(userId: string, groupId?: string): SettlementRequest[] {
    return this.settlementRequests.filter(
      r => r.fromUserId === userId && 
      (!groupId || r.groupId === groupId)
    );
  }

  // Helper function for currency formatting
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  static approveSettlementRequest(
    requestId: string,
    userId: string
  ): { success: boolean; transaction?: GroupTransaction; error?: string } {
    const request = this.getSettlementRequest(requestId);
    if (!request) {
      return { success: false, error: 'Request tidak ditemukan' };
    }

    if (request.toUserId !== userId) {
      return { success: false, error: 'Anda tidak berhak approve request ini' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Request sudah di-review' };
    }

    // Update request status
    request.status = 'approved';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = userId;

    // Create settlement transaction with reversed direction to cancel the debt
    // Original: fromUser owes toUser (fromUser → toUser)
    // Settlement: fromUser pays toUser, so we create reverse transaction (toUser → fromUser) with isPaid=true
    // This will offset the balance: original debt + reverse payment = 0
    const transactionResult = this.addGroupTransaction({
      groupId: request.groupId,
      fromUserId: request.toUserId, // REVERSED: receiver becomes sender
      toUserId: request.fromUserId,   // REVERSED: sender becomes receiver  
      amount: request.amount,
      description: `✓ ${request.description}`,
      date: new Date().toISOString(),
      isPaid: false, // Mark as unpaid so it counts in balance calculation to offset the debt
      createdBy: request.fromUserId,
    });

    if (!transactionResult.success) {
      return { success: false, error: transactionResult.error };
    }

    return { success: true, transaction: transactionResult.transaction };
  }

  static rejectSettlementRequest(
    requestId: string,
    userId: string,
    reason: string
  ): { success: boolean; error?: string } {
    const request = this.getSettlementRequest(requestId);
    if (!request) {
      return { success: false, error: 'Request tidak ditemukan' };
    }

    if (request.toUserId !== userId) {
      return { success: false, error: 'Anda tidak berhak reject request ini' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Request sudah di-review' };
    }

    request.status = 'rejected';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = userId;
    request.rejectionReason = reason;

    return { success: true };
  }

  // Reset database to initial state
  static reset(): void {
    this.users = [...STATIC_USERS];
    this.debts = [...STATIC_DEBTS];
    this.groups = [...STATIC_GROUPS];
    this.groupTransactions = [...STATIC_GROUP_TRANSACTIONS];
    this.settlementRequests = [];
  }
}