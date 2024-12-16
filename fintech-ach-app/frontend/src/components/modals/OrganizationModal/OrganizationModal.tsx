import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Organization } from '@/types/api';
import { UserRole } from '@/types/auth';

interface OrganizationModalProps {
    organization: Organization | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (organization: Organization) => void;
    onSuccess?: () => void;
    userRole?: UserRole;
}

interface FormErrors {
    name?: string;
    description?: string;
}

export function OrganizationModal({
    organization,
    isOpen,
    onClose,
    onDelete,
    onSuccess,
    userRole
}: OrganizationModalProps): JSX.Element {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [hasChanges, setHasChanges] = useState(false);

    React.useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name,
                description: organization.description ?? ''
            });
            setHasChanges(false);
        }
    }, [organization]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Check if any field is different from original
        const isChanged = name === 'name'
            ? value !== organization?.name || formData.description !== organization?.description
            : value !== organization?.description || formData.name !== organization?.name;

        setHasChanges(isChanged);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Organization name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!organization || !validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await api.put(`/management/organizations/${organization.id}`, formData);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error updating organization:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (): void => {
        if (!organization || !window.confirm('Are you sure you want to delete this organization?')) {
            return;
        }
        onDelete?.(organization);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog
                    as={motion.div}
                    static
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    open={isOpen}
                    onClose={onClose}
                    className="fixed inset-0 z-50 overflow-y-auto"
                >
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <Dialog.Panel
                            as={motion.div}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative mx-auto w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
                        >
                            <div className="absolute right-4 top-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="h-6 w-6 rounded-full"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </Button>
                            </div>

                            <Dialog.Title className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                                <span>Organization Details</span>
                                {organization?.status && (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                        {organization.status}
                                    </span>
                                )}
                            </Dialog.Title>

                            {organization && (
                                <>
                                    <div className="mt-6 space-y-6">
                                        <div className="space-y-4">
                                            <Input
                                                label="Organization Name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                error={errors.name}
                                                disabled={isSubmitting}
                                            />

                                            <Input
                                                label="Description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                error={errors.description}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                                                    <p className="mt-1 text-sm text-gray-900">
                                                        {formatDate(organization.created_at)}
                                                    </p>
                                                </div>

                                                {organization.updated_at && (
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {formatDate(organization.updated_at)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {userRole === UserRole.SUPERUSER && (
                                        <div className="mt-6 flex justify-between">
                                            <Button
                                                onClick={() => void handleSubmit()}
                                                isLoading={isSubmitting}
                                                disabled={!hasChanges || isSubmitting}
                                                className="inline-flex items-center space-x-2"
                                            >
                                                <DocumentDuplicateIcon className="h-4 w-4" />
                                                <span>Update Organization</span>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={() => void handleDelete()}
                                                className="inline-flex items-center space-x-2"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                                <span>Delete Organization</span>
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </Dialog.Panel>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
} 