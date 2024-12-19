import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InternalAccountForm } from '@/components/InternalAccountForm';
import { AccountsTable } from './AccountsTable';
import { EmptyAccountState } from './EmptyAccountState';
import type { Column, SortConfig } from '@/types/table';
import type { Account } from '@/types';

interface InternalAccountsTabProps {
    showInternalForm: boolean;
    data: {
        accounts: Account[];
        total: number;
    };
    // @ts-expect-error - Using index as fallback key when id/uuid not available
    columns: Column[];
    currentPage: number;
    pageSize: number;
    sortConfig: SortConfig;
    onInternalAccountSuccess: () => Promise<void>;
    onAccountClick: (account: Account) => void;
    onSort: (sortConfig: SortConfig) => void;
    onPageChange: (page: number) => void;
}

export function InternalAccountsTab({
    showInternalForm,
    data,
    columns,
    currentPage,
    pageSize,
    sortConfig,
    onInternalAccountSuccess,
    onAccountClick,
    onSort,
    onPageChange
}: InternalAccountsTabProps): JSX.Element {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <AnimatePresence mode="wait">
                {showInternalForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <InternalAccountForm
                            onSuccess={() => {
                                void onInternalAccountSuccess();
                            }}
                            onError={(error) => {
                                console.error('Account creation failed:', error);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {data.accounts.length ? (
                <AccountsTable
                    data={data}
                    columns={columns}
                    type="internal_accounts"
                    currentPage={currentPage}
                    pageSize={pageSize}
                    sortConfig={sortConfig}
                    onRowClick={onAccountClick}
                    onSort={onSort}
                    onPageChange={onPageChange}
                />
            ) : (
                <EmptyAccountState
                    title="No Internal Accounts"
                    message="Create your first internal account to get started"
                />
            )}
        </motion.div>
    );
} 