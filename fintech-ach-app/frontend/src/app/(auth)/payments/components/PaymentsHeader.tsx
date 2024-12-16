import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/types/auth';

interface PaymentsHeaderProps {
    showForm: boolean;
    userRole?: UserRole;
    onToggleForm: () => void;
}

export function PaymentsHeader({
    showForm,
    userRole,
    onToggleForm
}: PaymentsHeaderProps): JSX.Element {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-between items-center"
        >
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
            {userRole === UserRole.SUPERUSER && (
                <Button
                    onClick={onToggleForm}
                    className="inline-flex items-center space-x-2"
                >
                    {showForm ? 'Hide Form' : (
                        <>
                            <span>New Payment</span>
                        </>
                    )}
                </Button>
            )}
        </motion.div>
    );
} 