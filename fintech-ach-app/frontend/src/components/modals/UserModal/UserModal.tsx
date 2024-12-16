import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { User } from '@/types';
import { UserRole } from '@/types/auth';
import { useOrganizations } from '@/hooks/useOrganizations';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface UserModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (user: User) => void;
    onSuccess?: () => void;
    userRole?: UserRole;
}

interface FormData {
    name: string;
    email: string;
    role: string;
    organization_id?: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    role?: string;
    organization_id?: string;
}

export function UserModal({
    user,
    isOpen,
    onClose,
    onDelete,
    onSuccess,
    userRole
}: UserModalProps): JSX.Element {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        role: '',
        organization_id: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [hasChanges, setHasChanges] = useState(false);
    const { data: organizationsData, error: organizationsError } = useOrganizations();

    React.useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                organization_id: user.organization?.uuid ?? ''
            });
            setHasChanges(false);
        }
    }, [user]);

    const handleInputChange = (field: keyof FormData, value: string): void => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Check if any field is different from original
        const isChanged = field === 'name'
            ? value !== user?.name || formData.email !== user?.email || formData.role !== user?.role || formData.organization_id !== user?.organization?.uuid
            : field === 'email'
                ? value !== user?.email || formData.name !== user?.name || formData.role !== user?.role || formData.organization_id !== user?.organization?.uuid
                : field === 'role'
                    ? value !== user?.role || formData.name !== user?.name || formData.email !== user?.email || formData.organization_id !== user?.organization?.uuid
                    : value !== user?.organization?.uuid || formData.name !== user?.name || formData.email !== user?.email || formData.role !== user?.role;

        setHasChanges(isChanged);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!formData.role) {
            newErrors.role = 'Role is required';
        }

        if (formData.role === UserRole.ORGANIZATION_ADMIN && !formData.organization_id) {
            newErrors.organization_id = 'Organization is required for admin users';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!user || !validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const submissionData = {
                ...formData,
                role: formData.role.toLowerCase()
            };

            await api.put(`/management/users/${user.id}`, submissionData);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (): void => {
        if (!user || !window.confirm('Are you sure you want to delete this user?')) {
            return;
        }
        onDelete?.(user);
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
                                <span>User Details</span>
                                {user?.role && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                        {user.role}
                                    </span>
                                )}
                            </Dialog.Title>

                            {user && (
                                <>
                                    <div className="mt-6 space-y-6">
                                        <div className="space-y-4">
                                            <Input
                                                label="Name"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                error={errors.name}
                                                disabled={isSubmitting}
                                            />

                                            <Input
                                                label="Email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                error={errors.email}
                                                disabled={isSubmitting}
                                            />

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Role
                                                </label>
                                                <Select
                                                    value={formData.role}
                                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                                    className="mt-1"
                                                    disabled={isSubmitting}
                                                >
                                                    <option value="">Select Role</option>
                                                    <option value={UserRole.SUPERUSER}>Superuser</option>
                                                    <option value={UserRole.ORGANIZATION_ADMIN}>Organization Admin</option>
                                                </Select>
                                                {errors.role && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                                                )}
                                            </div>

                                            {formData.role === UserRole.ORGANIZATION_ADMIN && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Organization
                                                    </label>
                                                    {organizationsError ? (
                                                        <p className="mt-1 text-sm text-red-600">Failed to load organizations</p>
                                                    ) : !organizationsData ? (
                                                        <div className="mt-2">
                                                            <LoadingSpinner size="small" />
                                                        </div>
                                                    ) : (
                                                        <Select
                                                            value={formData.organization_id}
                                                            onChange={(e) => handleInputChange('organization_id', e.target.value)}
                                                            className="mt-1"
                                                            disabled={isSubmitting}
                                                        >
                                                            <option value="">Select Organization</option>
                                                            {organizationsData.organizations.map((org) => (
                                                                <option key={org.id} value={org.id}>
                                                                    {org.name}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    )}
                                                    {errors.organization_id && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.organization_id}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                                                    <p className="mt-1 text-sm text-gray-900">
                                                        {formatDate(user.created_at)}
                                                    </p>
                                                </div>

                                                {user.updated_at && (
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {formatDate(user.updated_at)}
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
                                                <span>Update User</span>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={() => void handleDelete()}
                                                className="inline-flex items-center space-x-2"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                                <span>Delete User</span>
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