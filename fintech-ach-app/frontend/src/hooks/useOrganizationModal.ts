'use client';

import { useState, useEffect } from 'react';
import { Organization } from '@/types/api';
import { api } from '@/lib/api';
import { UserRole } from '@/types/auth';

interface OrganizationFormData {
    name: string;
    description: string;
    status?: string;
}

interface UseOrganizationModalProps {
    organization: Organization | null;
    onSuccess: () => void;
    onError: (error: Error) => void;
    onClose: () => void;
    userRole?: UserRole;
}

interface UseOrganizationModalReturn {
    formData: OrganizationFormData;
    isSubmitting: boolean;
    isDeleting: boolean;
    canEdit: boolean;
    canDelete: boolean;
    hasChanges: boolean;
    handleChange: (field: keyof OrganizationFormData, value: string) => void;
    handleSubmit: () => Promise<void>;
    handleDelete: () => Promise<void>;
}

export function useOrganizationModal({
    organization,
    onSuccess,
    onError,
    onClose,
    userRole
}: UseOrganizationModalProps): UseOrganizationModalReturn {
    const [formData, setFormData] = useState<OrganizationFormData>({
        name: '',
        description: '',
        status: 'active'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const canEdit = userRole === UserRole.SUPERUSER;
    const canDelete = userRole === UserRole.SUPERUSER;

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name,
                description: organization.description,
                status: organization.status
            });
            setHasChanges(false);
        }
    }, [organization]);

    const handleChange = (field: keyof OrganizationFormData, value: string): void => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSubmit = async (): Promise<void> => {
        if (!canEdit) {
            onError(new Error('You do not have permission to edit organizations'));
            return;
        }

        setIsSubmitting(true);
        try {
            if (organization) {
                await api.patch(`/management/organizations/${organization.id}`, formData);
            } else {
                await api.post('/management/organizations', formData);
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
        if (!organization?.id) {
            onError(new Error('Organization ID is not available'));
            return;
        }

        if (!canDelete) {
            onError(new Error('You do not have permission to delete organizations'));
            return;
        }

        if (!window.confirm('Are you sure you want to delete this organization?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete(`/management/organizations/${organization.id}`);
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