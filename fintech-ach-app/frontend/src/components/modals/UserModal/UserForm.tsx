'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { User } from '@/types';
import { UserRole } from '@/types/auth';
import { useOrganizations } from '@/hooks/useOrganizations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Trash2, Save } from 'lucide-react';

interface UserFormProps {
    user: User | null;
    isSubmitting: boolean;
    isDeleting: boolean;
    canEdit: boolean;
    canDelete: boolean;
    hasChanges: boolean;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    onChange: (field: keyof User, value: string) => void;
    onDelete: () => Promise<void>;
}

interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    organization_id?: string;
}

interface FormErrors {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    organization_id?: string;
}

export function UserForm({ user, isSubmitting, isDeleting, canEdit, canDelete, hasChanges, onSubmit, onChange, onDelete }: UserFormProps): JSX.Element {
    const [formData, setFormData] = useState<FormData>({
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? '',
        role: user?.role ?? '',
        organization_id: user?.organization_id ?? ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const { data: organizationsData, error: organizationsError } = useOrganizations();

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
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

    const handleChange = (field: keyof FormData, value: string): void => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            onSubmit(e);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            <Input
                label="First Name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                error={errors.first_name}
                disabled={isSubmitting}
                required
            />

            <Input
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                error={errors.last_name}
                disabled={isSubmitting}
                required
            />

            <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                disabled={isSubmitting}
                required
            />

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Role
                </label>
                <Select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="mt-1"
                    disabled={isSubmitting}
                    required
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
                            onChange={(e) => handleChange('organization_id', e.target.value)}
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

            <div className="flex justify-end space-x-3">
                <Button
                    type="submit"
                    isLoading={isSubmitting}
                    leftIcon={<Save className="h-4 w-4" />}
                >
                    {user ? 'Update User' : 'Create User'}
                </Button>
                {canDelete && user && (
                    <Button
                        type="button"
                        onClick={() => void onDelete()}
                        isLoading={isDeleting}
                        variant="destructive"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                        Delete User
                    </Button>
                )}
            </div>
        </form>
    );
} 