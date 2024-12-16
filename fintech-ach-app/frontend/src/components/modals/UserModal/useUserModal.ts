'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { UserFormData, UseUserModalReturn } from '@/types/forms';
import { UserRole } from '@/types/auth';
import { ExtendedUser } from '@/types/auth';

interface UseUserModalProps {
    user: ExtendedUser | null;
    onSuccess: () => void;
    onError: (error: Error) => void;
    onClose: () => void;
}

export function useUserModal({
    user,
    onSuccess,
    onError,
    onClose
}: UseUserModalProps): UseUserModalReturn {
    const [formData, setFormData] = useState<UserFormData>({
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        name: user?.name ?? '',
        email: user?.email ?? '',
        role: user?.role ?? '',
        organization_id: user?.organization?.uuid ?? '',
        password: ''
    });
    const [initialData, setInitialData] = useState<UserFormData>({
        first_name: '',
        last_name: '',
        name: '',
        email: '',
        role: '',
        organization_id: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const { user: currentUser } = useAuth();

    // Reset form data when user changes
    useEffect(() => {
        if (user) {
            const data: UserFormData = {
                first_name: user.first_name ?? '',
                last_name: user.last_name ?? '',
                name: user.name,
                email: user.email,
                role: user.role,
                organization_id: user.organization?.uuid,
                password: ''
            };
            setFormData(data);
            setInitialData(data);
            setHasChanges(false);
        } else {
            const emptyData: UserFormData = {
                first_name: '',
                last_name: '',
                name: '',
                email: '',
                role: '',
                organization_id: '',
                password: ''
            };
            setFormData(emptyData);
            setInitialData(emptyData);
            setHasChanges(false);
        }
    }, [user]);

    const canEdit = currentUser?.role === UserRole.SUPERUSER;
    const canDelete = currentUser?.role === UserRole.SUPERUSER && user !== null;

    const checkForChanges = (data: UserFormData): boolean => {
        return (
            data.name !== initialData.name ||
            data.email !== initialData.email ||
            data.role !== initialData.role ||
            data.organization_id !== initialData.organization_id
        );
    };

    const handleChange = (field: keyof User, value: string): void => {
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

        if (!canEdit) {
            onError(new Error('You do not have permission to manage users'));
            return;
        }

        if (!hasChanges && user) {
            return;
        }

        setIsSubmitting(true);
        try {
            if (user) {
                await api.put(`/management/users/${user.uuid}`, formData);
            } else {
                await api.post('/management/users', formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('User operation error:', error);
            onError(error as Error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (!user?.uuid) {
            onError(new Error('User UUID is not available'));
            return;
        }

        if (!canDelete) {
            onError(new Error('You do not have permission to delete users'));
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete(`/management/users/${user.uuid}`);
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
        hasChanges,
        handleChange,
        handleSubmit,
        handleDelete
    };
} 