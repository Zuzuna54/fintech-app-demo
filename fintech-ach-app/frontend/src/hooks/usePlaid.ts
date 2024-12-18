'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface LinkTokenResponse {
    link_token: string;
}

interface ExchangeTokenResponse {
    account_id: string;
}

interface UsePlaidReturn {
    isLoading: boolean;
    error: Error | null;
    createLinkToken: (userId: string) => Promise<string>;
    exchangePublicToken: (publicToken: string, accountId: string) => Promise<string>;
}

export function usePlaid(): UsePlaidReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createLinkToken = async (userId: string): Promise<string> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post<LinkTokenResponse>('/plaid/create_link_token', {
                user_id: userId
            });
            return response.data.link_token;
        } catch (err) {
            const error = err as Error;
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const exchangePublicToken = async (publicToken: string, accountId: string): Promise<string> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post<ExchangeTokenResponse>('/plaid/exchange_token', {
                public_token: publicToken,
                account_id: accountId
            });
            return response.data.account_id;
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
        createLinkToken,
        exchangePublicToken
    };
} 