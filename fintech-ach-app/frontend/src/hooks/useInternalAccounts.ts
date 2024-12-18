'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Account } from '@/types';

interface InternalAccountFormData {
    name: string;
    organization_id: string;
    routing_number: string;
    account_number: string;
}

interface UseInternalAccountsReturn {
    isLoading: boolean;
    error: Error | null;
    createInternalAccount: (data: InternalAccountFormData) => Promise<Account>;
}

export function useInternalAccounts(): UseInternalAccountsReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createInternalAccount = async (data: InternalAccountFormData): Promise<Account> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post<Account>('/accounts/internal', data);
            return response.data;
        } catch (err) {
            const error = err as Error;
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        createInternalAccount
    };
} 