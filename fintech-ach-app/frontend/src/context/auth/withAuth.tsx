'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { UserRole, WithAuthOptions } from '@/types/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';


export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options: WithAuthOptions = { requireAuth: true }
): React.FC<P> {
    return function WithAuthComponent(props: P): React.ReactNode {
        const router = useRouter();
        const pathname = usePathname();
        const { redirectTo = '/login', requireAuth = true } = options;

        // Wrap the auth check in a try-catch to handle the case where AuthProvider isn't mounted yet
        try {
            const { user, isLoading, isAuthenticated } = useAuth();
            const { allowedRoles } = options;

            useEffect(() => {
                if (!isLoading) {
                    // Handle authentication check
                    if (requireAuth && !isAuthenticated) {
                        // Store the current URL for post-login redirect
                        if (typeof window !== 'undefined' && pathname !== '/login') {
                            sessionStorage.setItem('redirectUrl', pathname);
                        }
                        router.push(redirectTo);
                        return;
                    }

                    // Handle role-based access
                    if (allowedRoles && user) {
                        // Normalize user's role to uppercase for comparison
                        const normalizedUserRole = user.role.toUpperCase() as UserRole;
                        const hasAllowedRole = allowedRoles.some(role => role === normalizedUserRole);

                        if (!hasAllowedRole) {
                            console.log('Role validation failed:', {
                                userRole: normalizedUserRole,
                                allowedRoles,
                                hasAllowedRole
                            });
                            router.push('/unauthorized');
                            return;
                        }
                    }

                    // Handle authenticated users trying to access login page
                    if (isAuthenticated && pathname === '/login') {
                        const redirectUrl = sessionStorage.getItem('redirectUrl') || '/accounts';
                        sessionStorage.removeItem('redirectUrl');
                        router.push(redirectUrl);
                        return;
                    }
                }
            }, [isLoading, isAuthenticated, user, router, pathname]);

            // Show loading state
            if (isLoading) {
                return (
                    <div className="flex items-center justify-center min-h-screen">
                        <LoadingSpinner size="large" />
                    </div>
                );
            }

            // Handle unauthorized access
            if (requireAuth && !isAuthenticated) {
                return null;
            }

            // Handle role-based access
            if (allowedRoles && user) {
                const normalizedUserRole = user.role.toUpperCase() as UserRole;
                const hasAllowedRole = allowedRoles.some(role => role === normalizedUserRole);

                if (!hasAllowedRole) {
                    return null;
                }
            }

            // Render component if all checks pass
            return <WrappedComponent {...props} />;
        } catch (error) {
            // If AuthProvider isn't mounted yet, show loading state
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner size="large" />
                </div>
            );
        }
    };
} 