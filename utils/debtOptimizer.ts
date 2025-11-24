// Debt Optimization Algorithm
// Graph-based debt simplification untuk minimize transaksi

export interface UserBalance {
  userId: string;
  userName: string;
  balance: number; // positive = orang berhutang ke dia, negative = dia berhutang
}

export interface OptimizedDebt {
  from: string; // userId yang bayar
  fromName: string;
  to: string; // userId yang terima
  toName: string;
  amount: number;
}

export interface DebtActivity {
  id: string;
  timestamp: string;
  type: 'payment' | 'new_debt' | 'settled';
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  description: string;
}

/**
 * Optimasi hutang menggunakan algoritma greedy
 * Ide: Gabungkan semua hutang-piutang, lalu selesaikan dengan minimal transaksi
 */
export class DebtOptimizer {
  /**
   * Hitung balance bersih setiap user
   * Positive = orang berhutang ke user ini (piutang)
   * Negative = user ini berhutang ke orang lain (hutang)
   */
  static calculateUserBalances(allDebts: any[], allUsers: any[]): UserBalance[] {
    const balanceMap = new Map<string, UserBalance>();

    // Initialize all users
    allUsers.forEach(user => {
      balanceMap.set(user.id, {
        userId: user.id,
        userName: user.name,
        balance: 0,
      });
    });

    // Calculate balances from debts
    allDebts.forEach(debt => {
      if (debt.isPaid) return; // Skip paid debts

      const userBalance = balanceMap.get(debt.userId);
      if (!userBalance) return;

      if (debt.type === 'piutang') {
        // Orang berhutang ke user ini -> balance positif
        userBalance.balance += debt.amount;
      } else {
        // User ini berhutang ke orang -> balance negatif
        userBalance.balance -= debt.amount;
      }
    });

    return Array.from(balanceMap.values());
  }

  /**
   * Optimasi hutang dengan greedy algorithm
   * Minimize jumlah transaksi yang diperlukan
   */
  static optimizeDebts(balances: UserBalance[]): OptimizedDebt[] {
    // Copy array agar tidak mengubah original
    const workingBalances = balances.map(b => ({ ...b }));
    const optimizedDebts: OptimizedDebt[] = [];

    // Filter hanya yang punya balance (skip yang 0)
    const creditors = workingBalances.filter(b => b.balance > 0.01); // yang punya piutang
    const debtors = workingBalances.filter(b => b.balance < -0.01); // yang punya hutang

    // Sort untuk efisiensi
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => a.balance - b.balance);

    let i = 0; // index creditor
    let j = 0; // index debtor

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      // Hitung amount yang bisa diselesaikan
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0.01) {
        optimizedDebts.push({
          from: debtor.userId,
          fromName: debtor.userName,
          to: creditor.userId,
          toName: creditor.userName,
          amount: Math.round(amount),
        });

        // Update balances
        creditor.balance -= amount;
        debtor.balance += amount;
      }

      // Move to next if balance settled
      if (Math.abs(creditor.balance) < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    return optimizedDebts;
  }

  /**
   * Get full optimization result
   */
  static getOptimizedDebtGraph(allDebts: any[], allUsers: any[]): {
    balances: UserBalance[];
    optimizedDebts: OptimizedDebt[];
    totalTransactions: number;
    totalAmount: number;
  } {
    const balances = this.calculateUserBalances(allDebts, allUsers);
    const optimizedDebts = this.optimizeDebts(balances);

    const totalAmount = optimizedDebts.reduce((sum, d) => sum + d.amount, 0);

    return {
      balances,
      optimizedDebts,
      totalTransactions: optimizedDebts.length,
      totalAmount,
    };
  }

  /**
   * Find direct path between two users
   */
  static findDirectPath(
    fromUserId: string,
    toUserId: string,
    optimizedDebts: OptimizedDebt[]
  ): OptimizedDebt | null {
    return optimizedDebts.find(d => d.from === fromUserId && d.to === toUserId) || null;
  }

  /**
   * Get suggestions for a specific user
   */
  static getUserSuggestions(
    userId: string,
    optimizedDebts: OptimizedDebt[]
  ): {
    shouldPay: OptimizedDebt[];
    willReceive: OptimizedDebt[];
  } {
    const shouldPay = optimizedDebts.filter(d => d.from === userId);
    const willReceive = optimizedDebts.filter(d => d.to === userId);

    return { shouldPay, willReceive };
  }

  /**
   * Simulate payment and recalculate
   */
  static simulatePayment(
    allDebts: any[],
    allUsers: any[],
    fromUserId: string,
    toUserId: string,
    amount: number
  ): {
    before: OptimizedDebt[];
    after: OptimizedDebt[];
    impact: string;
  } {
    const before = this.optimizeDebts(this.calculateUserBalances(allDebts, allUsers));

    // Create a simulated payment
    const simulatedDebts = [
      ...allDebts,
      {
        id: 'sim',
        userId: fromUserId,
        type: 'piutang',
        name: 'Simulation',
        amount: amount,
        isPaid: false,
      },
      {
        id: 'sim2',
        userId: toUserId,
        type: 'hutang',
        name: 'Simulation',
        amount: amount,
        isPaid: false,
      },
    ];

    const after = this.optimizeDebts(
      this.calculateUserBalances(simulatedDebts, allUsers)
    );

    const impact =
      before.length > after.length
        ? `Mengurangi ${before.length - after.length} transaksi`
        : before.length === after.length
        ? 'Tidak ada perubahan'
        : 'Menambah transaksi';

    return { before, after, impact };
  }
}

/**
 * Activity Tracker for debt actions
 */
export class DebtActivityTracker {
  private static activities: DebtActivity[] = [];

  static addActivity(activity: Omit<DebtActivity, 'id' | 'timestamp'>): void {
    this.activities.unshift({
      ...activity,
      id: `act${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 activities
    if (this.activities.length > 50) {
      this.activities = this.activities.slice(0, 50);
    }
  }

  static getRecentActivities(limit: number = 10): DebtActivity[] {
    return this.activities.slice(0, limit);
  }

  static clearActivities(): void {
    this.activities = [];
  }

  static getActivitiesForUser(userId: string, limit: number = 10): DebtActivity[] {
    return this.activities
      .filter(a => a.from === userId || a.to === userId)
      .slice(0, limit);
  }
}
