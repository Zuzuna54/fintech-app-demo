'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AuthContextType, User, isUser } from '@/types/auth';
import {
    getToken,
    getRefreshToken,
    removeTokens,
    isTokenExpired,
    shouldRefreshToken
} from './utils';
import { authReducer, initialState } from './reducer';
import { useRoleChecks, useTokenRefreshInterval } from './hooks';
import { fetchUserData, updateUserData, logoutUser } from './userService';
import { loginUser, refreshUserToken } from './authService';
import HTTPException from 'axios';

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const router = useRouter();

    // Initialize role checking hooks
    const { checkRole, hasRequiredRole } = useRoleChecks(state.user);

    // Handle token refresh
    const refreshToken = useCallback(async () => {
        try {
            console.debug("[AUTH] Starting token refresh");
            const { user } = await refreshUserToken();
            if (!isUser(user)) {
                throw new Error('Invalid user data received');
            }
            dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
            console.debug("[AUTH] Token refresh successful");
        } catch (error) {
            console.error("[AUTH] Token refresh failed:", error);
            // Only logout if the error is authentication-related
            if (error instanceof HTTPException && error.status === 401) {
                dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
                removeTokens();
                router.push('/login');
            }
            // For other errors, we'll keep the user logged in
            throw error;
        }
    }, [router]);

    // Check authentication status on mount
    useEffect(() => {
        const initializeAuth = async (): Promise<void> => {
            dispatch({ type: 'AUTH_START' });
            const token = getToken();
            const refreshTokenStr = getRefreshToken();

            if (!token || !refreshTokenStr) {
                dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' });
                return;
            }

            try {
                // Always set the token in headers first
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // If token is expired, try to refresh
                if (isTokenExpired(token)) {
                    try {
                        const { user } = await refreshUserToken();
                        dispatch({
                            type: 'AUTH_SUCCESS',
                            payload: { user }
                        });
                        return;
                    } catch (error) {
                        console.error('Token refresh failed:', error);
                        removeTokens();
                        dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
                        return;
                    }
                }

                // Token is valid, fetch user data
                const userData = await fetchUserData();
                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: {
                        user: userData,
                        lastLogin: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error('Auth initialization error:', error);
                removeTokens();
                delete api.defaults.headers.common['Authorization'];
                dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to initialize auth' });
            }
        };

        void initializeAuth();
    }, []);

    // Set up automatic token refresh
    useEffect(() => {
        const token = getToken();
        if (!token) return;

        const checkTokenExpiry = async (): Promise<void> => {
            try {
                if (shouldRefreshToken(token)) {
                    await refreshToken();
                }
            } catch (error) {
                console.error("[AUTH] Token refresh check failed:", error);
                // Don't logout on network errors or other temporary issues
                if (error instanceof HTTPException && error.status === 401) {
                    dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
                    removeTokens();
                    router.push('/login');
                }
            }
        };

        // Initial check
        void checkTokenExpiry();

        const interval = setInterval(() => {
            void checkTokenExpiry();
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [refreshToken, router]);

    // Login function
    const login = async (email: string, password: string): Promise<void> => {
        dispatch({ type: 'AUTH_START' });
        try {
            await loginUser(email, password);
            const userData = await fetchUserData();

            dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                    user: userData,
                    lastLogin: new Date().toISOString()
                }
            });
        } catch (error) {
            // Remove tokens and clear header on error
            removeTokens();
            delete api.defaults.headers.common['Authorization'];

            const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
            dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
            throw error;
        }
    };

    // Logout function
    const logout = async (): Promise<void> => {
        try {
            await logoutUser();
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            removeTokens();
            delete api.defaults.headers.common['Authorization'];
            dispatch({ type: 'AUTH_LOGOUT' });
            router.push('/login');
        }
    };

    // Update user function
    const updateUser = async (userData: Partial<User>): Promise<void> => {
        try {
            const updatedUser = await updateUserData(userData);
            dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
            dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
            throw error;
        }
    };

    // Clear error function
    const clearError = (): void => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        ...state,
        login,
        logout,
        refreshToken,
        updateUser,
        clearError,
        checkRole,
        hasRequiredRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 
