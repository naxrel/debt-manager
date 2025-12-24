// API Configuration
export const API_CONFIG = {
    // Base URL - ganti sesuai environment
    BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://your-production-api.com',

    // Timeout settings
    TIMEOUT: 30000, // 30 seconds

    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
};

// Storage keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: '@debt_app:access_token',
    USER_DATA: '@debt_app:user_data',
};
