import React from 'react';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/types/auth';
import { motion } from 'framer-motion';

interface UsersHeaderProps {
    showForm: boolean;
    userRole?: UserRole;
    onToggleForm: () => void;
}

export function UsersHeader({ showForm, userRole, onToggleForm }: UsersHeaderProps): JSX.Element {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-between items-center"
        >
            <h1 className="text-2xl font-bold text-gray-800">Users</h1>
            {userRole === UserRole.SUPERUSER && (
                <Button
                    onClick={onToggleForm}
                    className="inline-flex items-center space-x-2"
                >
                    {showForm ? 'Hide Form' : 'New User'}
                </Button>
            )}
        </motion.div>
    );
} 