import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { User, UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { api } from '@/lib/api';
import { Organization } from '@/types/api';
import { UserFormData } from '@/types/forms';
import { XCircle } from 'lucide-react';

interface UserFormProps {
    formData: UserFormData;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onChange: (field: keyof UserFormData, value: string) => void;
    errors: FormErrors;
    setErrors: (errors: FormErrors) => void;
}

interface FormErrors {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    organization_id?: string;
    password?: string;
    general?: string;
}

interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
}

export function UserForm({
    formData,
    isSubmitting,
    onSubmit,
    onChange,
    errors,
    setErrors
}: UserFormProps): JSX.Element {
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

        if (!formData.first_name?.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name?.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!formData.role) {
            newErrors.role = 'Role is required';
        }

        const userRole = formData.role as UserRole;
        if (userRole === UserRole.ORGANIZATION_ADMIN && !formData.organization_id) {
            newErrors.organization_id = 'Organization is required for admin users';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (validateForm()) {
            await onSubmit(e);
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
                    <CardTitle>Create New User</CardTitle>
                </CardHeader>
                <CardContent>
                    {errors.general && (
                        <div className="mb-4 rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {errors.general}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                value={formData.first_name}
                                onChange={(e) => onChange('first_name', e.target.value)}
                                error={errors.first_name}
                                disabled={isSubmitting}
                                required
                            />

                            <Input
                                label="Last Name"
                                value={formData.last_name}
                                onChange={(e) => onChange('last_name', e.target.value)}
                                error={errors.last_name}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => onChange('email', e.target.value)}
                            error={errors.email}
                            disabled={isSubmitting}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => onChange('password', e.target.value)}
                            error={errors.password}
                            disabled={isSubmitting}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <Select
                                value={formData.role}
                                onChange={(e) => onChange('role', e.target.value)}
                                className="mt-1"
                                disabled={isSubmitting}
                                required
                            >
                                <option value="">Select Role</option>
                                <option value="SUPERUSER">Superuser</option>
                                <option value="ORGANIZATION_ADMIN">Organization Admin</option>
                            </Select>
                            {errors.role && (
                                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                            )}
                        </div>

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
                                    onChange={(e) => onChange('organization_id', e.target.value)}
                                    className="mt-1"
                                    disabled={isSubmitting}
                                    required
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

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                            >
                                Create
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
} 