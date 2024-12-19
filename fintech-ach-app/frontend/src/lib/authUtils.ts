import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '@/types/auth';
import { useCallback } from 'react';
import { UserRole, User } from '@/types/auth';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const removeTokens = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwtDecode<TokenPayload>(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch {
        return true;
    }
};

export const shouldRefreshToken = (token: string): boolean => {
    try {
        const decoded = jwtDecode<TokenPayload>(token);
        const currentTime = Date.now() / 1000;
        // Refresh if token will expire in less than 5 minutes
        return decoded.exp - currentTime < 300;
    } catch {
        return true;
    }
};

export function useRoleChecks(user: User | null): {
    checkRole: (allowedRoles: UserRole[]) => boolean;
    hasRequiredRole: (user: User | null, allowedRoles: UserRole[]) => boolean;
} {
    const checkRole = useCallback((allowedRoles: UserRole[]): boolean => {
        return Boolean(user && allowedRoles.includes(user.role));
    }, [user]);

    const hasRequiredRole = useCallback((user: User | null, allowedRoles: UserRole[]): boolean => {
        return Boolean(user && allowedRoles.includes(user.role));
    }, []);

    return {
        checkRole,
        hasRequiredRole
    };
}

export function useTokenRefreshInterval(token: string | null, refreshCallback: () => Promise<void>): (() => void) | undefined {
    return useCallback(() => {
        if (!token) return undefined;

        const checkTokenExpiry = async (): Promise<void> => {
            try {
                if (shouldRefreshToken(token)) {
                    await refreshCallback();
                }
            } catch (error) {
                console.error("[AUTH] Token refresh check failed:", error);
            }
        };

        // Initial check
        void checkTokenExpiry();

        const interval = setInterval(() => {
            void checkTokenExpiry();
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [token, refreshCallback]);
} 