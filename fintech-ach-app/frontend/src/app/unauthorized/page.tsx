'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';

export default function UnauthorizedPage(): JSX.Element {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Access Denied
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        You don&apos;t have permission to access this page.
                    </p>
                    <div className="space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Go Back
                        </button>
                        {user ? (
                            <button
                                onClick={() => router.push('/accounts')}
                                className="block w-full text-center text-indigo-600 hover:text-indigo-500 mt-2"
                            >
                                Return to Dashboard
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/login')}
                                className="block w-full text-center text-indigo-600 hover:text-indigo-500 mt-2"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 