import React, { type ReactElement, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Organization, CreateOrganizationDto } from '@/types/api';

interface OrganizationFormProps {
    organization?: Organization;
    onSuccess: () => void;
    isSubmitting: boolean;
    onSubmit: (data: CreateOrganizationDto) => Promise<void>;
}

interface FormErrors {
    name?: string;
    description?: string;
}

export function OrganizationForm({
    organization,
    onSuccess,
    isSubmitting,
    onSubmit
}: OrganizationFormProps): ReactElement {
    const [formData, setFormData] = useState<CreateOrganizationDto>({
        name: organization?.name ?? '',
        description: organization?.description ?? ''
    });
    const [errors, setErrors] = useState<FormErrors>({});

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

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
            onSuccess();
        } catch (error) {
            console.error('Error submitting organization:', error);
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
                    <CardTitle>{organization ? 'Edit Organization' : 'Create Organization'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                        <Input
                            label="Organization Name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            error={errors.name}
                            disabled={isSubmitting}
                        />

                        <Input
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            error={errors.description}
                            disabled={isSubmitting}
                        />

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                            >
                                {organization ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
} 