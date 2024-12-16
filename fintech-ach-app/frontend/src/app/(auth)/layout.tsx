'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNavigation } from '@/components/SidebarNavigation';
import { useAuth } from '@/context/auth';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}): JSX.Element {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (!isAuthenticated || !user) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center min-h-screen"
            >
                <LoadingSpinner size="large" text="Authenticating..." />
            </motion.div>
        );
    }

    // Define navigation links based on user role
    const getNavLinks = (): { name: string; path: string }[] => {
        const baseLinks = [
            { name: 'Accounts', path: '/accounts' },
            { name: 'Payments', path: '/payments' }
        ];

        if (user.role === UserRole.SUPERUSER) {
            return [
                ...baseLinks,
                { name: 'Organizations', path: '/organizations' },
                { name: 'Users', path: '/users' }
            ];
        }

        if (user.role === UserRole.ORGANIZATION_ADMIN) {
            return [
                ...baseLinks,
                // { name: 'Organization', path: '/organization' }
            ];
        }

        return baseLinks;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-screen overflow-hidden"
        >
            <div className="flex h-full">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="h-full"
                >
                    <SidebarNavigation links={getNavLinks()} />
                </motion.div>
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.3 }}
                    className="flex-1 overflow-auto h-screen bg-gray-50"
                >
                    <div className="mx-auto max-w-7xl h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.main>
            </div>
        </motion.div>
    );
} 