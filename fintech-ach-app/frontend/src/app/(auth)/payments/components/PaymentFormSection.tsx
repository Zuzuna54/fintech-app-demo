import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentForm } from '@/components/forms/PaymentForm';
import type { Account } from '@/types';

interface PaymentFormSectionProps {
    showForm: boolean;
    accounts: Account[];
    onSuccess: () => void;
    onError: (error: Error) => void;
}

export function PaymentFormSection({
    showForm,
    accounts,
    onSuccess,
    onError
}: PaymentFormSectionProps): JSX.Element {
    return (
        <AnimatePresence mode="wait">
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className="bg-white rounded-lg shadow-sm">
                        <PaymentForm
                            accounts={accounts}
                            onSuccess={onSuccess}
                            onError={onError}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 