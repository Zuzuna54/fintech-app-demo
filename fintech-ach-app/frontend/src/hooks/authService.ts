import { api } from '@/lib/api';
import { AuthResponse, isAuthResponse } from '@/types/auth';
import { setTokens, getRefreshToken } from '../lib/authUtils';
import { fetchUserData } from './userService';

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    // First get the tokens
    const tokenResponse = await api.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
    }>('/auth/token', {
        email,
        password
    });

    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token || !refresh_token) {
        throw new Error('Invalid token response');
    }

    // Save tokens and set authorization header
    setTokens(access_token, refresh_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    return {
        access_token,
        refresh_token,
        token_type: 'Bearer',
        user: await fetchUserData()
    };
}

export async function refreshUserToken(): Promise<AuthResponse> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await api.post<AuthResponse>('/auth/refresh', {
        refresh_token: refreshToken
    });

    if (!isAuthResponse(response.data)) {
        throw new Error('Invalid response format from refresh token endpoint');
    }

    const { access_token, refresh_token } = response.data;
    setTokens(access_token, refresh_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    return response.data;
} 