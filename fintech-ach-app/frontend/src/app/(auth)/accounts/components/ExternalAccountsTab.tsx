import React from 'react';
import { motion } from 'framer-motion';
import { AccountsTable } from './AccountsTable';
import { EmptyAccountState } from './EmptyAccountState';
import type { Column, SortConfig } from '@/types/table';
import type { Account } from '@/types';

interface ExternalAccountsTabProps {
    data: {
        accounts: Account[];
        total: number;
    };
    // @ts-expect-error - Using index as fallback key when id/uuid not available
    columns: Column[];
    currentPage: number;
    pageSize: number;
    sortConfig: SortConfig;
    isOrgAdmin: boolean;
    onAccountClick: (account: Account) => void;
    onSort: (sortConfig: SortConfig) => void;
    onPageChange: (page: number) => void;
}

export function ExternalAccountsTab({
    data,
    columns,
    currentPage,
    pageSize,
    sortConfig,
    isOrgAdmin,
    onAccountClick,
    onSort,
    onPageChange
}: ExternalAccountsTabProps): JSX.Element {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {!data.accounts.length ? (
                <EmptyAccountState
                    title="No External Accounts"
                    message={isOrgAdmin
                        ? "Link your first bank account to get started"
                        : "No external accounts have been linked yet"
                    }
                />
            ) : (
                <AccountsTable
                    data={data}
                    columns={columns}
                    type="external_accounts"
                    currentPage={currentPage}
                    pageSize={pageSize}
                    sortConfig={sortConfig}
                    onRowClick={onAccountClick}
                    onSort={onSort}
                    onPageChange={onPageChange}
                />
            )}
        </motion.div>
    );
} 