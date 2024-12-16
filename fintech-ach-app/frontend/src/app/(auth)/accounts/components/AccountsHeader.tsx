import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaidLink } from '@/components/PlaidLink';

interface AccountsHeaderProps {
    isSuperUser: boolean;
    isOrgAdmin: boolean;
    selectedTab: number;
    showInternalForm: boolean;
    organizationId?: string;
    onToggleInternalForm: () => void;
    onPlaidSuccess: () => Promise<void>;
    onPlaidError: (error: Error) => void;
}

export function AccountsHeader({
    isSuperUser,
    isOrgAdmin,
    selectedTab,
    showInternalForm,
    organizationId,
    onToggleInternalForm,
    onPlaidSuccess,
    onPlaidError
}: AccountsHeaderProps): JSX.Element {
    return (
        <motion.div
            className="flex justify-between items-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-2xl font-semibold text-gray-900"
            >
                Accounts
            </motion.h1>
            <div className="flex items-center gap-4">
                <AnimatePresence mode="wait">
                    {isSuperUser && selectedTab === 0 && (
                        <motion.button
                            onClick={onToggleInternalForm}
                            className="btn btn-primary inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            <motion.span>
                                {showInternalForm ? 'Hide Form' : 'New Internal Account'}
                            </motion.span>
                        </motion.button>
                    )}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                    {isOrgAdmin && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="flex justify-between items-center"
                        >
                            <PlaidLink
                                organizationId={organizationId ?? ''}
                                onSuccess={() => {
                                    void onPlaidSuccess();
                                }}
                                onError={onPlaidError}
                            >
                                Link Bank Account
                            </PlaidLink>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
} 