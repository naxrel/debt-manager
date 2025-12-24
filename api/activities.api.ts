import apiClient from './client';
import { Activity, AddActivityRequest } from './types';

export const activitiesApi = {
    /**
     * Get recent activities
     * @param limit - Number of activities to return (default: 10)
     */
    async getRecentActivities(limit: number = 10): Promise<Activity[]> {
        const response = await apiClient.get<Activity[]>(`/debts/activities?limit=${limit}`);
        return response.data;
    },

    /**
     * Get activities for a specific user
     * @param userId - User ID to filter by
     * @param limit - Number of activities to return (default: 10)
     */
    async getUserActivities(userId: string, limit: number = 10): Promise<Activity[]> {
        const response = await apiClient.get<Activity[]>(`/debts/activities/${userId}?limit=${limit}`);
        return response.data;
    },

    /**
     * Add a new activity
     */
    async addActivity(data: AddActivityRequest): Promise<Activity> {
        const response = await apiClient.post<Activity>('/debts/activity', data);
        return response.data;
    },

    /**
     * Clear all activities
     */
    async clearActivities(): Promise<{ ok: boolean }> {
        const response = await apiClient.delete<{ ok: boolean }>('/debts/activities');
        return response.data;
    },
};
