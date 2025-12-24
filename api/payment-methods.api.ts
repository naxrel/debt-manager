import apiClient from './client';
import {
    CreatePaymentMethodRequest,
    PaymentMethod,
    UpdatePaymentMethodRequest,
} from './types';

export const paymentMethodsApi = {
    /**
     * Create a new payment method
     */
    async create(data: CreatePaymentMethodRequest): Promise<PaymentMethod> {
        const response = await apiClient.post<PaymentMethod>('/payment-methods', data);
        return response.data;
    },

    /**
     * Get all payment methods for authenticated user
     */
    async getAll(): Promise<PaymentMethod[]> {
        const response = await apiClient.get<PaymentMethod[]>('/payment-methods');
        return response.data;
    },

    /**
     * Get primary payment method
     */
    async getPrimary(): Promise<PaymentMethod | null> {
        const response = await apiClient.get<PaymentMethod>('/payment-methods/primary');
        return response.data;
    },

    /**
     * Get payment method by ID
     */
    async getById(id: string): Promise<PaymentMethod> {
        const response = await apiClient.get<PaymentMethod>(`/payment-methods/${id}`);
        return response.data;
    },

    /**
     * Update payment method
     */
    async update(id: string, data: UpdatePaymentMethodRequest): Promise<PaymentMethod> {
        const response = await apiClient.put<PaymentMethod>(`/payment-methods/${id}`, data);
        return response.data;
    },

    /**
     * Delete payment method
     */
    async delete(id: string): Promise<{ ok: boolean }> {
        const response = await apiClient.delete<{ ok: boolean }>(`/payment-methods/${id}`);
        return response.data;
    },

    /**
     * Set payment method as primary
     */
    async setPrimary(id: string): Promise<PaymentMethod> {
        const response = await apiClient.post<PaymentMethod>(`/payment-methods/${id}/set-primary`);
        return response.data;
    },
};
