'use client';

import { useState, useEffect } from 'react';
import { Account, AccountStatus, BankAccountType } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { UserRole } from '@/types/auth';

interface AccountFormData {
    name: string;
    account_type: BankAccountType;
    status: AccountStatus;
    balance?: number;
    routing_number?: string;
    account_number?: string;
}

interface UseAccountModalProps {
    account: Account | null;
    onSuccess: () => void;
    onError: (error: Error) => void;
    onClose: () => void;
}

interface UseAccountModalReturn {
    formData: AccountFormData;
    isSubmitting: boolean;
    isDeleting: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isInternalAccount: boolean;
    hasChanges: boolean;
    handleChange: (field: keyof AccountFormData, value: string | number) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleDelete: () => Promise<void>;
}

export function useAccountModal({
    account,
    onSuccess,
    onError,
    onClose
}: UseAccountModalProps): UseAccountModalReturn {
    const { user } = useAuth();
    const [formData, setFormData] = useState<AccountFormData>({
        name: '',
        account_type: BankAccountType.CHECKING,
        status: AccountStatus.ACTIVE,
        balance: 0,
        routing_number: '',
        account_number: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const isInternalAccount = account?.account_type === BankAccountType.INTERNAL;
    const canEdit = user?.role === UserRole.SUPERUSER ||
        (user?.role === UserRole.ORGANIZATION_ADMIN && !isInternalAccount);
    const canDelete = user?.role === UserRole.SUPERUSER;

    useEffect(() => {
        if (account) {
            setFormData({
                name: account.name,
                account_type: account.account_type,
                status: account.status,
                balance: account.balance,
                routing_number: account.routing_number,
                account_number: account.account_number
            });
            setHasChanges(false);
        }
    }, [account]);

    const handleChange = (field: keyof AccountFormData, value: string | number): void => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!canEdit) {
            onError(new Error('You do not have permission to edit this account'));
            return;
        }

        setIsSubmitting(true);
        try {
            if (account) {
                await api.patch(`/accounts/${account.id}`, formData);
            } else {
                await api.post('/accounts', formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
            onError(error as Error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (!account?.id) {
            onError(new Error('Account ID is not available'));
            return;
        }

        if (!canDelete) {
            onError(new Error('You do not have permission to delete accounts'));
            return;
        }

        if (!window.confirm('Are you sure you want to delete this account?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete(`/accounts/${account.id}`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Delete error:', error);
            onError(error as Error);
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        formData,
        isSubmitting,
        isDeleting,
        canEdit,
        canDelete,
        isInternalAccount,
        hasChanges,
        handleChange,
        handleSubmit,
        handleDelete
    };
} 