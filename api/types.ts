// API Response Types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    statusCode?: number;
}

// Auth Types
export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    name: string;
    email: string;
}

export interface LoginResponse {
    access_token: string;
    user: {
        userId: string;
        username: string;
        name: string;
        email: string;
    };
}

export interface UserProfile {
    id: string;
    username: string;
    name: string;
    email: string;
}

// Debt Types
export interface DebtInput {
    userId: string;
    type: 'hutang' | 'piutang';
    amount: number;
    isPaid: boolean;
}

export interface UserInput {
    id: string;
    name: string;
}

export interface OptimizeDebtsRequest {
    allDebts: DebtInput[];
    allUsers: UserInput[];
}

export interface OptimizedDebt {
    from: string;
    fromName: string;
    to: string;
    toName: string;
    amount: number;
}

export interface OptimizeDebtsResponse {
    balances: {
        userId: string;
        userName: string;
        balance: number;
    }[];
    optimizedDebts: OptimizedDebt[];
    totalTransactions: number;
    totalAmount: number;
}

export interface SimulatePaymentRequest {
    allDebts: DebtInput[];
    allUsers: UserInput[];
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export interface SimulatePaymentResponse {
    before: OptimizedDebt[];
    after: OptimizedDebt[];
    impact: string;
}

export interface FindPathRequest {
    fromUserId: string;
    toUserId: string;
    allDebts?: DebtInput[];
    allUsers?: UserInput[];
    optimizedDebts?: OptimizedDebt[];
}

export interface FindPathResponse {
    path: OptimizedDebt | null;
}

export interface GetSuggestionsRequest {
    userId: string;
    allDebts?: DebtInput[];
    allUsers?: UserInput[];
    optimizedDebts?: OptimizedDebt[];
}

export interface GetSuggestionsResponse {
    shouldPay: OptimizedDebt[];
    willReceive: OptimizedDebt[];
}

// Activity Types
export interface Activity {
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

export interface AddActivityRequest {
    type: 'payment' | 'new_debt' | 'settled';
    from: string;
    fromName: string;
    to: string;
    toName: string;
    amount: number;
    description: string;
}

// Payment Method Types
export interface PaymentMethod {
    id: string;
    userId: string;
    type: 'bank_transfer' | 'credit_card' | 'e_wallet' | 'cash';
    provider: string;
    accountNumber: string;
    accountHolder: string;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePaymentMethodRequest {
    type: 'bank_transfer' | 'credit_card' | 'e_wallet' | 'cash';
    provider: string;
    accountNumber: string;
    accountHolder: string;
    isPrimary?: boolean;
}

export interface UpdatePaymentMethodRequest {
    type?: string;
    provider?: string;
    accountNumber?: string;
    accountHolder?: string;
    isPrimary?: boolean;
    isActive?: boolean;
}
