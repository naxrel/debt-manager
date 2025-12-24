import { API_CONFIG, STORAGE_KEYS } from '@/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token from storage:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401 && originalRequest) {
            // Clear stored credentials
            await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);

            // You can add navigation to login screen here if needed
            // navigationRef.current?.navigate('Login');
        }

        // Handle network errors
        if (!error.response) {
            console.error('Network error:', error.message);
            return Promise.reject({
                message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
                originalError: error,
            });
        }

        // Handle other errors
        const errorData = error.response?.data as any;
        const errorMessage = errorData?.message || error.message || 'Terjadi kesalahan';
        return Promise.reject({
            statusCode: error.response?.status,
            message: errorMessage,
            originalError: error,
        });
    }
);

export default apiClient;
