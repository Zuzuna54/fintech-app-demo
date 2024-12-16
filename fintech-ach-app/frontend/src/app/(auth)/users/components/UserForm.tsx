import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { User } from '@/types';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { api } from '@/lib/api';
import { Organization } from '@/types/api';

interface UserFormProps {
    user?: User;
    onSuccess: () => void;
}

interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    organization_id?: string;
    password?: string;
}

interface FormErrors {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    organization_id?: string;
    password?: string;
}

interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
}

export function UserForm({ user, onSuccess }: UserFormProps): JSX.Element {
    const [formData, setFormData] = useState<FormData>({
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? '',
        role: user?.role ?? '',
        organization_id: user?.organization_id ?? '',
        password: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
    const [organizationsError, setOrganizationsError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrganizations = async (): Promise<void> => {
            setIsLoadingOrganizations(true);
            setOrganizationsError(null);
            try {
                const response = await api.get<OrganizationsResponse>('/management/organizations');
                if (response.data?.organizations) {
                    setOrganizations(response.data.organizations);
                } else {
                    console.error('Organizations data is missing from response');
                    setOrganizationsError('Failed to load organizations');
                }
            } catch (error) {
                console.error('Failed to fetch organizations:', error);
                setOrganizationsError('Failed to load organizations');
            } finally {
                setIsLoadingOrganizations(false);
            }
        };

        void fetchOrganizations();
    }, []);

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

        if (!user && !formData.password) {
            newErrors.password = 'Password is required for new users';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const submissionData = {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role.toLowerCase(),
                password: formData.password
            };

            if (formData.role === UserRole.ORGANIZATION_ADMIN && formData.organization_id) {
                submissionData['organization_id'] = formData.organization_id;
            }

            if (user) {
                const { password, ...updateData } = submissionData;
                await api.put(`/management/users/${user.id}`, updateData);
            } else {
                await api.post('/management/users', submissionData);
            }
            onSuccess();
        } catch (error) {
            console.error('Error submitting user:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
                height: { duration: 0.2 },
                opacity: { duration: 0.2, delay: 0.1 }
            }}
            className="overflow-hidden"
        >
            <Card>
                <CardHeader>
                    <CardTitle>{user ? 'Edit User' : 'Create User'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                value={formData.first_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                error={errors.first_name}
                                disabled={isSubmitting}
                                required
                            />

                            <Input
                                label="Last Name"
                                value={formData.last_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                error={errors.last_name}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            error={errors.email}
                            disabled={isSubmitting}
                            required
                        />

                        {!user && (
                            <Input
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                error={errors.password}
                                disabled={isSubmitting}
                                required
                            />
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <Select
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
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
                                    <p className="mt-1 text-sm text-red-600">{organizationsError}</p>
                                ) : isLoadingOrganizations ? (
                                    <div className="mt-2">
                                        <LoadingSpinner size="small" />
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.organization_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, organization_id: e.target.value }))}
                                        className="mt-1"
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Select Organization</option>
                                        {organizations.map((org) => (
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

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                            >
                                {user ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
} 