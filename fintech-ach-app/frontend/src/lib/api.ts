import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { StructuredError } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const logError = (error: StructuredError): void => {
    console.error('API Error:', JSON.stringify(error, null, 2));
};

// Create axios instance with default config
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Important for handling cookies if your API uses them
});

// Add request interceptor to ensure headers are present
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');

    if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    logError({
        type: 'REQUEST_ERROR',
        message: (error as Error).message || 'Request configuration failed',
        timestamp: new Date().toISOString()
    });
    return Promise.reject(error);
});

// Error interceptor to handle 401 responses
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const structuredError: StructuredError = {
            type: 'API_ERROR',
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            message: error.message || 'An unknown error occurred',
            timestamp: new Date().toISOString()
        };

        logError(structuredError);

        // Handle unauthorized or forbidden responses
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Clear auth tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Only redirect if we're in a browser environment
            if (typeof window !== 'undefined') {
                // Store the current URL for post-login redirect
                sessionStorage.setItem('redirectUrl', window.location.pathname);
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Fetcher function for SWR
export const fetcher = <T,>(url: string): Promise<T> =>
    api.get<T>(url)
        .then((res) => res.data)
        .catch((error: AxiosError) => {
            const structuredError: StructuredError = {
                type: 'SWR_FETCH_ERROR',
                status: error.response?.status,
                url,
                method: 'GET',
                message: error.message || 'Failed to fetch data',
                timestamp: new Date().toISOString()
            };
            logError(structuredError);
            throw error;
        });
