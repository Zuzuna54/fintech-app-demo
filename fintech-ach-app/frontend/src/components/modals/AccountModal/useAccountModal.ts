import { useState, useEffect } from 'react';
import { Account } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { AccountFormData, UseAccountModalReturn } from '@/types/forms';
import { UserRole } from '@/types/auth';

interface UseAccountModalProps {
    account: Account | null;
    onSuccess: () => void;
    onError: (error: Error) => void;
    onClose: () => void;
}

export function useAccountModal({
    account,
    onSuccess,
    onError,
    onClose
}: UseAccountModalProps): UseAccountModalReturn {
    const [formData, setFormData] = useState<AccountFormData>({});
    const [initialData, setInitialData] = useState<AccountFormData>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const { user } = useAuth();

    // Reset form data and initial data when account changes
    useEffect(() => {
        if (account) {
            const data = {
                name: account.name,
                account_type: account.account_type,
                status: account.status
            };
            setFormData(data);
            setInitialData(data);
            setHasChanges(false);
        }
    }, [account]);

    const isSuperuser = user?.role === UserRole.SUPERUSER;
    const isOrgAdmin = user?.role === UserRole.ORGANIZATION_ADMIN;
    const isInternalAccount = account ? !account.organization_id : false;

    // Superuser can only edit internal accounts
    // Org admin can only edit external accounts
    const canEdit = (isSuperuser && isInternalAccount) || (isOrgAdmin && !isInternalAccount);

    // Superuser can only delete internal accounts
    // Org admin can only delete external accounts
    const canDelete = (isSuperuser && isInternalAccount) || (isOrgAdmin && !isInternalAccount);

    const checkForChanges = (data: AccountFormData): boolean => {
        return (
            data.name !== initialData.name ||
            data.account_type !== initialData.account_type ||
            data.status !== initialData.status
        );
    };

    const handleChange = (field: keyof Account, value: string): void => {
        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: value
            };
            setHasChanges(checkForChanges(updated));
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        // Validate required conditions
        if (!account?.uuid) {
            onError(new Error('Account UUID is not available'));
            return;
        }

        if (!canEdit) {
            onError(new Error('You do not have permission to edit this account'));
            return;
        }

        if (!hasChanges) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Use different endpoints for internal and external accounts
            const endpoint = isInternalAccount
                ? `/accounts/internal/${account.uuid}`
                : `/accounts/external/${account.uuid}`;

            await api.put(endpoint, formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            onError(error as Error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (): Promise<void> => {
        // Validate required conditions
        if (!account?.uuid) {
            onError(new Error('Account UUID is not available'));
            return;
        }

        if (!canDelete) {
            onError(new Error('You do not have permission to delete this account'));
            return;
        }

        if (!window.confirm('Are you sure you want to delete this account?')) {
            return;
        }

        setIsDeleting(true);
        try {
            // Use different endpoints for internal and external accounts
            const endpoint = isInternalAccount
                ? `/accounts/internal/${account.uuid}`
                : `/accounts/external/${account.uuid}`;

            await api.delete(endpoint);
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