import { STORAGE_KEYS } from '@/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import { LoginRequest, LoginResponse, RegisterRequest, UserProfile } from './types';

export const authApi = {
    /**
     * Register a new user
     */
    async register(data: RegisterRequest): Promise<UserProfile> {
        const response = await apiClient.post<UserProfile>('/auth/register', data);
        return response.data;
    },

    /**
     * Login user and store token
     */
    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>('/auth/login', data);

        // Store token and user data
        if (response.data.access_token) {
            await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.access_token);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
        }

        return response.data;
    },

    /**
     * Logout user - clear stored credentials
     */
    async logout(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    },

    /**
     * Get stored token
     */
    async getToken(): Promise<string | null> {
        return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    },

    /**
     * Get stored user data
     */
    async getStoredUser(): Promise<LoginResponse['user'] | null> {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    },
};
