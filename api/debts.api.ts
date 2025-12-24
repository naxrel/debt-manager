import apiClient from './client';
import {
    FindPathRequest,
    FindPathResponse,
    GetSuggestionsRequest,
    GetSuggestionsResponse,
    OptimizeDebtsRequest,
    OptimizeDebtsResponse,
    SimulatePaymentRequest,
    SimulatePaymentResponse,
} from './types';

// Debt CRUD types
export interface Debt {
    id: string;
    userId: string;
    type: 'hutang' | 'piutang';
    name: string;
    otherUserId?: string;
    amount: number;
    description: string;
    date: string;
    isPaid: boolean;
    groupId?: string;
    status: 'pending' | 'confirmed' | 'rejected' | 'settlement_requested';
    initiatedBy: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDebtRequest {
    type: 'hutang' | 'piutang';
    name: string;
    otherUserId?: string;
    amount: number;
    description: string;
    date: string;
    isPaid?: boolean;
    groupId?: string;
    status?: 'pending' | 'confirmed';
}

export interface UpdateDebtRequest {
    type?: 'hutang' | 'piutang';
    name?: string;
    otherUserId?: string;
    amount?: number;
    description?: string;
    date?: string;
    isPaid?: boolean;
    status?: 'pending' | 'confirmed' | 'rejected' | 'settlement_requested';
}

export interface DebtStatistics {
    totalHutang: number;
    totalPiutang: number;
    totalPaidHutang: number;
    totalPaidPiutang: number;
    netBalance: number;
    totalDebts: number;
    unpaidDebts: number;
    paidDebts: number;
}

export const debtsApi = {
    // ========== CRUD Operations ==========

    /**
     * Create a new debt
     */
    async create(data: CreateDebtRequest): Promise<Debt> {
        const response = await apiClient.post<Debt>('/debts/crud', data);
        return response.data;
    },

    /**
     * Get all debts for authenticated user
     * @param filters - Optional filters (type, isPaid, status)
     */
    async getAll(filters?: { type?: string; isPaid?: boolean; status?: string }): Promise<Debt[]> {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.isPaid !== undefined) params.append('isPaid', String(filters.isPaid));
        if (filters?.status) params.append('status', filters.status);

        const queryString = params.toString();
        const url = queryString ? `/debts/crud?${queryString}` : '/debts/crud';

        const response = await apiClient.get<Debt[]>(url);
        return response.data;
    },

    /**
     * Get debt summary/statistics
     */
    async getSummary(): Promise<DebtStatistics> {
        const response = await apiClient.get<DebtStatistics>('/debts/crud/summary');
        return response.data;
    },

    /**
     * Get debt by ID
     */
    async getById(id: string): Promise<Debt> {
        const response = await apiClient.get<Debt>(`/debts/crud/${id}`);
        return response.data;
    },

    /**
     * Update debt
     */
    async update(id: string, data: UpdateDebtRequest): Promise<Debt> {
        const response = await apiClient.put<Debt>(`/debts/crud/${id}`, data);
        return response.data;
    },

    /**
     * Delete debt
     */
    async delete(id: string): Promise<{ ok: boolean }> {
        const response = await apiClient.delete<{ ok: boolean }>(`/debts/crud/${id}`);
        return response.data;
    },

    /**
     * Mark debt as paid
     */
    async markAsPaid(id: string): Promise<Debt> {
        const response = await apiClient.post<Debt>(`/debts/crud/${id}/mark-paid`);
        return response.data;
    },

    /**
     * Mark debt as unpaid
     */
    async markAsUnpaid(id: string): Promise<Debt> {
        const response = await apiClient.post<Debt>(`/debts/crud/${id}/mark-unpaid`);
        return response.data;
    },

    /**
     * Get debt statistics (alias for getSummary)
     */
    async getStatistics(): Promise<DebtStatistics> {
        return this.getSummary();
    },

    // ========== Optimization (existing) ==========

    /**
     * Calculate optimized debts using greedy algorithm
     */
    async optimize(data: OptimizeDebtsRequest): Promise<OptimizeDebtsResponse> {
        const response = await apiClient.post<OptimizeDebtsResponse>('/debts/optimize', data);
        return response.data;
    },

    /**
     * Simulate payment impact
     */
    async simulate(data: SimulatePaymentRequest): Promise<SimulatePaymentResponse> {
        const response = await apiClient.post<SimulatePaymentResponse>('/debts/simulate', data);
        return response.data;
    },

    /**
     * Find direct payment path between two users
     */
    async findPath(data: FindPathRequest): Promise<FindPathResponse> {
        const response = await apiClient.post<FindPathResponse>('/debts/path', data);
        return response.data;
    },

    /**
     * Get payment suggestions for a specific user
     */
    async getSuggestions(data: GetSuggestionsRequest): Promise<GetSuggestionsResponse> {
        const response = await apiClient.post<GetSuggestionsResponse>('/debts/suggestions', data);
        return response.data;
    },
};
