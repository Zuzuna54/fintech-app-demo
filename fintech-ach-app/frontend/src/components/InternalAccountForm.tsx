import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BankAccountType } from '@/types/accounts';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';
import { Save } from 'lucide-react';
import { useAuth } from '@/auth';
import { UserRole } from '@/types/auth';
import { FormData, FormErrors, FormTouched } from '@/types/forms';
import { Organization } from '@/types/api';

interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
}

interface InternalAccountFormProps {
    onSuccess: () => void;
    onError: (error: Error) => void;
}

export function InternalAccountForm({ onSuccess, onError }: InternalAccountFormProps): JSX.Element {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        account_type: BankAccountType.FUNDING,
        routing_number: '',
        account_number: '',
        organization_id: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<FormTouched>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchOrganizations = async (): Promise<void> => {
            try {
                const response = await api.get<OrganizationsResponse>('/management/organizations');
                if (response.data?.organizations) {
                    setOrganizations(response.data.organizations);
                } else {
                    console.error('Organizations data is missing from response');
                    onError(new Error('Failed to load organizations'));
                }
            } catch (error) {
                console.error('Failed to fetch organizations:', error);
                onError(error as Error);
            }
        };

        if (user?.role === UserRole.SUPERUSER) {
            void fetchOrganizations();
        }
    }, [user, onError]);

    const validate = (data: FormData): FormErrors => {
        const errors: FormErrors = {};

        if (!data.name) {
            errors.name = 'Account name is required';
        } else if (data.name.length < 3) {
            errors.name = 'Account name must be at least 3 characters';
        }

        if (!data.account_type) {
            errors.account_type = 'Account type is required';
        }

        if (!data.routing_number) {
            errors.routing_number = 'Routing number is required';
        } else if (!/^\d{9}$/.test(data.routing_number)) {
            errors.routing_number = 'Routing number must be 9 digits';
        }

        if (!data.account_number) {
            errors.account_number = 'Account number is required';
        } else if (!/^\d{4,17}$/.test(data.account_number)) {
            errors.account_number = 'Account number must be between 4 and 17 digits';
        }

        if (user?.role === UserRole.SUPERUSER && !data.organization_id) {
            errors.organization_id = 'Organization is required';
        }

        return errors;
    };

    const handleChange = (field: keyof FormData, value: string | BankAccountType): void => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        setTouched({ ...touched, [field]: true });
        setErrors(validate(newData));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(formData).reduce((acc, key) => ({
            ...acc,
            [key]: true
        }), {});
        setTouched(allTouched);

        // Validate form
        const validationErrors = validate(formData);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/accounts/internal', formData);
            onSuccess();
            // Reset form
            setFormData({
                name: '',
                account_type: BankAccountType.FUNDING,
                routing_number: '',
                account_number: '',
                organization_id: ''
            });
            setTouched({});
            setErrors({});
        } catch (error) {
            onError(error as Error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Internal Account</CardTitle>
                <CardDescription>
                    Create a new internal account for managing funds
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                    <Input
                        label="Account Name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        error={touched.name ? errors.name : undefined}
                        disabled={isSubmitting}
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Account Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={formData.account_type === BankAccountType.FUNDING ? 'primary' : 'outline'}
                                onClick={() => handleChange('account_type', BankAccountType.FUNDING)}
                                disabled={isSubmitting}
                            >
                                Funding Account
                            </Button>
                            <Button
                                type="button"
                                variant={formData.account_type === BankAccountType.CLAIMS ? 'primary' : 'outline'}
                                onClick={() => handleChange('account_type', BankAccountType.CLAIMS)}
                                disabled={isSubmitting}
                            >
                                Claims Account
                            </Button>
                        </div>
                        {touched.account_type && errors.account_type && (
                            <p className="text-sm text-red-600">
                                {errors.account_type}
                            </p>
                        )}
                    </div>

                    <Input
                        label="Routing Number"
                        value={formData.routing_number}
                        onChange={(e) => handleChange('routing_number', e.target.value)}
                        error={touched.routing_number ? errors.routing_number : undefined}
                        disabled={isSubmitting}
                        maxLength={9}
                        pattern="\d*"
                        inputMode="numeric"
                    />

                    <Input
                        label="Account Number"
                        value={formData.account_number}
                        onChange={(e) => handleChange('account_number', e.target.value)}
                        error={touched.account_number ? errors.account_number : undefined}
                        disabled={isSubmitting}
                        maxLength={17}
                        pattern="\d*"
                        inputMode="numeric"
                    />

                    {user?.role === UserRole.SUPERUSER && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Organization
                            </label>
                            <select
                                value={formData.organization_id}
                                onChange={(e) => handleChange('organization_id', e.target.value)}
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Select organization</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                            {touched.organization_id && errors.organization_id && (
                                <p className="text-sm text-red-600">
                                    {errors.organization_id}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            leftIcon={<Save className="h-4 w-4" />}
                        >
                            Create Account
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
} 