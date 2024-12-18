'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { UserRole } from '@/types/auth';

interface UserFormData {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    organization_id?: string;
    password?: string;
}

interface UseUserModalProps {
    user: User | null;
    onSuccess: () => void;
    onError: (error: Error) => void;
    onClose: () => void;
}

interface UseUserModalReturn {
    formData: UserFormData;
    isSubmitting: boolean;
    isDeleting: boolean;
    canEdit: boolean;
    canDelete: boolean;
    hasChanges: boolean;
    handleChange: (field: keyof UserFormData, value: string) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleDelete: () => Promise<void>;
}

export function useUserModal({
    user,
    onSuccess,
    onError,
    onClose
}: UseUserModalProps): UseUserModalReturn {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState<UserFormData>({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        organization_id: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const canEdit = currentUser?.role === UserRole.SUPERUSER;
    const canDelete = currentUser?.role === UserRole.SUPERUSER;

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name ?? '',
                last_name: user.last_name ?? '',
                email: user.email,
                role: user.role,
                organization_id: user.organization_id ?? '',
                password: ''
            });
            setHasChanges(false);
        }
    }, [user]);

    const handleChange = (field: keyof UserFormData, value: string): void => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!canEdit) {
            onError(new Error('You do not have permission to edit users'));
            return;
        }

        setIsSubmitting(true);
        try {
            if (user) {
                await api.patch(`/management/users/${user.id}`, formData);
            } else {
                await api.post('/management/users', formData);
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
        if (!user?.id) {
            onError(new Error('User ID is not available'));
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
            await api.delete(`/management/users/${user.id}`);
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