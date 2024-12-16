import React from 'react';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { AccountModalProps } from '../../../types/modal';
import { useAccountModal } from './useAccountModal';
import { AccountForm } from './AccountForm';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function AccountModal({
    account,
    isOpen,
    onClose,
    onSuccess,
    onError
}: AccountModalProps): JSX.Element | null {
    const {
        formData,
        isSubmitting,
        isDeleting,
        canEdit,
        canDelete,
        isInternalAccount,
        hasChanges,
        handleChange,
        handleSubmit,
        handleDelete
    } = useAccountModal({
        account,
        onSuccess,
        onError,
        onClose
    });

    if (!account) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black bg-opacity-25"
                            onClick={onClose}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <Card className="relative w-full max-w-2xl">
                                <div className="absolute right-4 top-4 z-10">
                                    <motion.button
                                        onClick={onClose}
                                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <X className="h-5 w-5" />
                                    </motion.button>
                                </div>
                                <CardHeader className="pr-14">
                                    <div className="flex items-center justify-between">
                                        <CardTitle>
                                            {isInternalAccount ? 'Internal Account Details' : 'External Account Details'}
                                        </CardTitle>
                                        <Badge variant={getStatusBadgeVariant(account.status)}>
                                            {account.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <AccountForm
                                        formData={formData}
                                        account={account}
                                        isSubmitting={isSubmitting}
                                        isDeleting={isDeleting}
                                        canEdit={canEdit}
                                        canDelete={canDelete}
                                        isInternalAccount={isInternalAccount}
                                        hasChanges={hasChanges}
                                        onSubmit={handleSubmit}
                                        onChange={handleChange}
                                        onDelete={handleDelete}
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
} 