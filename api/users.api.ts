import apiClient from './client';
import { UserProfile } from './types';

export const usersApi = {
    /**
     * Get current user's profile (requires authentication)
     */
    async getProfile(): Promise<UserProfile> {
        const response = await apiClient.get<UserProfile>('/users/profile');
        return response.data;
    },

    /**
     * Get all users (requires authentication)
     */
    async getAllUsers(): Promise<UserProfile[]> {
        const response = await apiClient.get<UserProfile[]>('/users');
        return response.data;
    },
};
