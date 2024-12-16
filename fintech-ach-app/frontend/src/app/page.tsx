/* eslint-disable @typescript-eslint/require-await */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { UserRole } from '@/types/auth';

export default function Home(): JSX.Element {
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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            <div className="space-y-4 text-center">
                <LoadingSpinner className="w-8 h-8" />
                <h2 className="text-xl font-semibold text-gray-700">
                    Initializing Application...
                </h2>
                <p className="text-sm text-gray-500">
                    Please wait while we set up your workspace
                </p>
            </div>
        </div>
    );
}
