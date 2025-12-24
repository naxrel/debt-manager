import apiClient from './client';

// ========== Types ==========

export interface Group {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    isActive: boolean;
    groupImage?: string | null;
    createdAt: string;
    updatedAt: string;
    creator?: {
        id: string;
        name: string;
        username: string;
    };
    members?: GroupMember[];
    transactions?: GroupTransaction[];
    settlements?: SettlementRequest[];
    _count?: {
        members: number;
        transactions: number;
        settlements: number;
    };
}

export interface GroupMember {
    id: string;
    userId: string;
    groupId: string;
    joinedAt: string;
    user: {
        id: string;
        name: string;
        username: string;
        email?: string;
    };
}

export interface GroupTransaction {
    id: string;
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: string | number;
    description: string;
    date: string;
    isPaid: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    fromUser?: {
        id: string;
        name: string;
        username: string;
    };
    toUser?: {
        id: string;
        name: string;
        username: string;
    };
    creator?: {
        id: string;
        name: string;
        username: string;
    };
}

export interface SettlementRequest {
    id: string;
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: string | number;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    fromUser?: {
        id: string;
        name: string;
        username: string;
    };
    toUser?: {
        id: string;
        name: string;
        username: string;
    };
    group?: {
        id: string;
        name: string;
    };
}

export interface CreateGroupRequest {
    name: string;
    description: string;
    groupImage?: string;
}

export interface UpdateGroupRequest {
    name?: string;
    description?: string;
    groupImage?: string;
    isActive?: boolean;
}

export interface CreateGroupTransactionRequest {
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    description: string;
    date: string;
}

export interface UpdateGroupTransactionRequest {
    fromUserId?: string;
    toUserId?: string;
    amount?: number;
    description?: string;
    date?: string;
    isPaid?: boolean;
}

export interface CreateSettlementRequest {
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    description: string;
}

export interface ReviewSettlementRequest {
    status: 'approved' | 'rejected';
    rejectionReason?: string;
}

// ========== Groups API ==========

export const groupsApi = {
    /**
     * Create a new group
     */
    async create(data: CreateGroupRequest): Promise<Group> {
        const response = await apiClient.post<Group>('/groups', data);
        return response.data;
    },

    /**
     * Get all groups for authenticated user
     */
    async getAll(): Promise<Group[]> {
        const response = await apiClient.get<Group[]>('/groups');
        return response.data;
    },

    /**
     * Get group by ID
     */
    async getById(id: string): Promise<Group> {
        const response = await apiClient.get<Group>(`/groups/${id}`);
        return response.data;
    },

    /**
     * Update group (only creator can update)
     */
    async update(id: string, data: UpdateGroupRequest): Promise<Group> {
        const response = await apiClient.put<Group>(`/groups/${id}`, data);
        return response.data;
    },

    /**
     * Delete group (only creator can delete)
     */
    async delete(id: string): Promise<{ ok: boolean }> {
        const response = await apiClient.delete<{ ok: boolean }>(`/groups/${id}`);
        return response.data;
    },

    /**
     * Get group members
     */
    async getMembers(groupId: string): Promise<GroupMember[]> {
        const response = await apiClient.get<GroupMember[]>(`/groups/${groupId}/members`);
        return response.data;
    },

    /**
     * Add member to group
     */
    async addMember(groupId: string, userId: string): Promise<GroupMember> {
        const response = await apiClient.post<GroupMember>(`/groups/${groupId}/members`, { userId });
        return response.data;
    },

    /**
     * Remove member from group
     */
    async removeMember(groupId: string, userId: string): Promise<{ ok: boolean }> {
        const response = await apiClient.delete<{ ok: boolean }>(`/groups/${groupId}/members/${userId}`);
        return response.data;
    },
};

// ========== Group Transactions API ==========

export const groupTransactionsApi = {
    /**
     * Create a group transaction
     */
    async create(data: CreateGroupTransactionRequest): Promise<GroupTransaction> {
        const response = await apiClient.post<GroupTransaction>('/group-transactions', data);
        return response.data;
    },

    /**
     * Get all group transactions (optionally filter by groupId)
     */
    async getAll(groupId?: string): Promise<GroupTransaction[]> {
        const url = groupId ? `/group-transactions?groupId=${groupId}` : '/group-transactions';
        const response = await apiClient.get<GroupTransaction[]>(url);
        return response.data;
    },

    /**
     * Get transaction by ID
     */
    async getById(id: string): Promise<GroupTransaction> {
        const response = await apiClient.get<GroupTransaction>(`/group-transactions/${id}`);
        return response.data;
    },

    /**
     * Update transaction (only creator can update)
     */
    async update(id: string, data: UpdateGroupTransactionRequest): Promise<GroupTransaction> {
        const response = await apiClient.put<GroupTransaction>(`/group-transactions/${id}`, data);
        return response.data;
    },

    /**
     * Delete transaction (only creator can delete)
     */
    async delete(id: string): Promise<{ ok: boolean }> {
        const response = await apiClient.delete<{ ok: boolean }>(`/group-transactions/${id}`);
        return response.data;
    },

    /**
     * Mark transaction as paid
     */
    async markAsPaid(id: string): Promise<GroupTransaction> {
        const response = await apiClient.post<GroupTransaction>(`/group-transactions/${id}/mark-paid`);
        return response.data;
    },

    /**
     * Mark transaction as unpaid
     */
    async markAsUnpaid(id: string): Promise<GroupTransaction> {
        const response = await apiClient.post<GroupTransaction>(`/group-transactions/${id}/mark-unpaid`);
        return response.data;
    },
};

// ========== Settlement Requests API ==========

export const settlementsApi = {
    /**
     * Create a settlement request
     */
    async create(data: CreateSettlementRequest): Promise<SettlementRequest> {
        const response = await apiClient.post<SettlementRequest>('/settlement-requests', data);
        return response.data;
    },

    /**
     * Get all settlement requests (optionally filter by groupId and status)
     */
    async getAll(filters?: { groupId?: string; status?: string }): Promise<SettlementRequest[]> {
        const params = new URLSearchParams();
        if (filters?.groupId) params.append('groupId', filters.groupId);
        if (filters?.status) params.append('status', filters.status);

        const queryString = params.toString();
        const url = queryString ? `/settlement-requests?${queryString}` : '/settlement-requests';

        const response = await apiClient.get<SettlementRequest[]>(url);
        return response.data;
    },

    /**
     * Get pending settlements for user
     */
    async getPending(groupId?: string): Promise<SettlementRequest[]> {
        const url = groupId
            ? `/settlement-requests/pending?groupId=${groupId}`
            : '/settlement-requests/pending';
        const response = await apiClient.get<SettlementRequest[]>(url);
        return response.data;
    },

    /**
     * Get settlement request by ID
     */
    async getById(id: string): Promise<SettlementRequest> {
        const response = await apiClient.get<SettlementRequest>(`/settlement-requests/${id}`);
        return response.data;
    },

    /**
     * Review settlement request (approve or reject)
     */
    async review(id: string, data: ReviewSettlementRequest): Promise<SettlementRequest> {
        const response = await apiClient.post<SettlementRequest>(`/settlement-requests/${id}/review`, data);
        return response.data;
    },

    /**
     * Delete settlement request (only creator can delete, only if pending)
     */
    async delete(id: string): Promise<{ ok: boolean }> {
        const response = await apiClient.delete<{ ok: boolean }>(`/settlement-requests/${id}`);
        return response.data;
    },
};
