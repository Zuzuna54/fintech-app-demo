/* eslint-disable @typescript-eslint/require-await */
'use client';

import React, { type ReactElement, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { UserRole } from '@/types/auth';

export default function Home(): ReactElement {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        const handleInitialRedirect = async (): Promise<void> => {
            if (isLoading) return;

            if (!isAuthenticated) {
                void router.push('/login');
                return;
            }

            // Default to accounts page for all users
            let redirectPath = '/accounts';

            // Additional role-specific redirects if needed
            if (user) {
                switch (user.role) {
                    case UserRole.SUPERUSER:
                        redirectPath = '/accounts';
                        break;
                    case UserRole.ORGANIZATION_ADMIN:
                        redirectPath = '/accounts';
                        break;
                    default:
                        redirectPath = '/accounts';
                        break;
                }
            }

            void router.push(redirectPath);
        };

        void handleInitialRedirect();
    }, [isLoading, isAuthenticated, user, router]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-100 flex flex-col justify-center items-center p-8">
            <div className="space-y-8 text-center max-w-lg w-full">
                <div className="bg-white p-10 rounded-2xl shadow-xl border border-blue-200 transition-all duration-300 hover:shadow-2xl">
                    <h2 className="text-3xl font-bold text-gray-900 mt-8 tracking-tight">
                        Preparing Your Financial Dashboard
                    </h2>
                    <p className="text-lg text-gray-600 mt-4 font-medium">
                        Setting up your secure banking environment
                    </p>
                    <LoadingSpinner
                        size="large"
                        className="text-blue-600 mx-auto"
                    />
                </div>
            </div>
        </div>
    );
}
