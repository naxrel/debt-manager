// Static Database untuk Demo
// Database ini berisi user dan data utang piutang yang sudah terdaftar

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
}

export interface Debt {
  id: string;
  userId: string; // ID user yang memiliki data ini
  type: 'hutang' | 'piutang'; // hutang = kita yang berhutang, piutang = orang yang berhutang ke kita
  name: string; // Nama orang yang terlibat
  amount: number;
  description: string;
  date: string;
  isPaid: boolean;
  groupId?: string; // Optional: ID grup jika debt ini bagian dari grup
}

export interface DebtGroup {
  id: string;
  name: string;
  description: string;
  creatorId: string; // User yang membuat grup
  memberIds: string[]; // Array of user IDs yang jadi member
  createdAt: string;
  isActive: boolean;
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
  // Group 1 transactions
  {
    id: 'gt1',
    groupId: 'g1',
    fromUserId: '1',
    toUserId: '2',
    amount: 200000,
    description: 'Bayar hosting server',
    date: '2025-11-05',
    isPaid: false,
    createdBy: '1',
  },
  {
    id: 'gt2',
    groupId: 'g1',
    fromUserId: '2',
    toUserId: '3',
    amount: 300000,
    description: 'Bayar design UI/UX',
    date: '2025-11-08',
    isPaid: false,
    createdBy: '2',
  },
  {
    id: 'gt3',
    groupId: 'g1',
    fromUserId: '3',
    toUserId: '1',
    amount: 150000,
    description: 'Bayar domain',
    date: '2025-11-10',
    isPaid: true,
    createdBy: '3',
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
    memberIds: string[]
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
    };

    this.groups.push(newGroup);
    return { success: true, group: newGroup };
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

  // Group Transaction operations
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

  // Reset database to initial state
  static reset(): void {
    this.users = [...STATIC_USERS];
    this.debts = [...STATIC_DEBTS];
    this.groups = [...STATIC_GROUPS];
    this.groupTransactions = [...STATIC_GROUP_TRANSACTIONS];
  }
}
