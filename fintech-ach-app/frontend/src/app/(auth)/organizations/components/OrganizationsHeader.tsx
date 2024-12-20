import React, { type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/types/auth';

interface OrganizationsHeaderProps {
    showForm: boolean;
    userRole?: UserRole;
    onToggleForm: () => void;
}

export function OrganizationsHeader({
    showForm,
    userRole,
    onToggleForm
}: OrganizationsHeaderProps): ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-between items-center"
        >
            <h1 className="text-2xl font-bold text-gray-800">Organizations</h1>
            {userRole === UserRole.SUPERUSER && (
                <Button
                    onClick={onToggleForm}
                    className="inline-flex items-center space-x-2"
                >
                    {showForm ? 'Hide Form' : 'New Organization'}
                </Button>
            )}
        </motion.div>
    );
} 