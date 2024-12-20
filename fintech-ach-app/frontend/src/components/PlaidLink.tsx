'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    usePlaidLink, PlaidLinkOptions,
    // PlaidLinkOnSuccessMetadata 
} from 'react-plaid-link';
import { Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface PlaidLinkProps {
    organizationId: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    children?: React.ReactNode;
}

interface LinkTokenResponse {
    link_token: string;
}

interface ExchangeTokenResponse {
    status: string;
    account_ids: string[];
}

export function PlaidLink({ organizationId, onSuccess, onError, children }: PlaidLinkProps): JSX.Element {
    const [isLinking, setIsLinking] = useState(false);
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [shouldReinitialize, setShouldReinitialize] = useState(false);
    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const initPlaid = useCallback(async (): Promise<void> => {
        try {
            const response = await api.post<LinkTokenResponse>('/plaid/create_link_token', {
                organization_id: organizationId
            });

            if (!response.data.link_token) {
                throw new Error('No link token received from server');
            }

            if (mountedRef.current) {
                setLinkToken(response.data.link_token);
                setShouldReinitialize(false);
            }
        } catch (error) {
            console.error('Error getting link token:', error);
            if (mountedRef.current) {
                onError?.(error instanceof Error ? error : new Error('Failed to get link token'));
            }
        }
    }, [organizationId, onError]);

    useEffect(() => {
        if (!linkToken || shouldReinitialize) {
            void initPlaid();
        }
    }, [linkToken, shouldReinitialize, initPlaid]);

    const onPlaidSuccess = useCallback(
        async (publicToken: string,
            // metadata: PlaidLinkOnSuccessMetadata
        ) => {
            try {
                setIsLinking(true);
                const response = await api.post<ExchangeTokenResponse>('/plaid/exchange_token', {
                    public_token: publicToken,
                    organization_id: organizationId
                });

                if (response.data.status !== 'success' || !response.data.account_ids?.length) {
                    throw new Error('Failed to link accounts');
                }

                onSuccess?.();
            } catch (error) {
                console.error('Error linking account:', error);
                onError?.(error instanceof Error ? error : new Error('Failed to link account'));
            } finally {
                if (mountedRef.current) {
                    setIsLinking(false);
                    setLinkToken(null);
                    setShouldReinitialize(true);
                }
            }
        },
        [organizationId, onSuccess, onError]
    );

    const config: PlaidLinkOptions = {
        token: linkToken,
        receivedRedirectUri: undefined,
        env: (process.env.NEXT_PUBLIC_PLAID_ENV as 'sandbox' | 'development' | 'production') ?? 'sandbox',
        onSuccess: (public_token) => {
            void onPlaidSuccess(public_token,
                // metadata
            );
        },
        onExit: () => {
            if (mountedRef.current) {
                setIsLinking(false);
                setShouldReinitialize(true);
            }
        },
        onEvent: () => undefined,
    };

    const { open, ready, error } = usePlaidLink(config);

    useEffect(() => {
        if (error && mountedRef.current) {
            setLinkToken(null);
            setShouldReinitialize(true);
            onError?.(new Error(error.message || 'Plaid Link Error'));
        }
    }, [error, onError]);

    return (
        <Button
            onClick={() => {
                setIsLinking(true);
                open();
            }}
            disabled={!ready || !linkToken || isLinking}
            isLoading={isLinking}
            variant="primary"
            size="lg"
            leftIcon={!isLinking && <LinkIcon className="h-4 w-4" />}
        >
            {isLinking ? 'Linking Account...' : children ?? 'Link Bank Account'}
        </Button>
    );
} 