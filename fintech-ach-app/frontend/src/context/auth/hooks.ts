import { useCallback } from 'react';
import { UserRole, User } from '@/types/auth';

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

        const interval = setInterval(() => {
            void refreshCallback();
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [token, refreshCallback]);
} 