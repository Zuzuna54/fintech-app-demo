import React from 'react';
import { motion } from 'framer-motion';
import { Table } from '@/components/tables/Table';
import { Button } from '@/components/ui/Button';
import type { Column, SortConfig } from '@/types/table';
import type { Account } from '@/types';

interface AccountsTableProps {
    data: {
        accounts: Account[];
        total: number;
    };
    columns: Column[];
    type: 'internal_accounts' | 'external_accounts';
    currentPage: number;
    pageSize: number;
    sortConfig: SortConfig;
    onRowClick: (account: Account) => void;
    onSort: (sortConfig: SortConfig) => void;
    onPageChange: (page: number) => void;
}

export function AccountsTable({
    data,
    columns,
    type,
    currentPage,
    pageSize,
    sortConfig,
    onRowClick,
    onSort,
    onPageChange
}: AccountsTableProps): JSX.Element {
    const totalPages = Math.ceil(data.total / pageSize);

    return (
        <div className="cursor-pointer">
            <Table
                columns={columns}
                data={{
                    accounts: data.accounts,
                    total: data.total,
                    limit: pageSize,
                    offset: (currentPage - 1) * pageSize
                }}
                type={type}
                onRowClick={(item) => {
                    void onRowClick(item as Account);
                }}
                sortConfig={sortConfig}
                onSort={onSort}
            />
            {totalPages > 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="px-6 py-4 border-t border-gray-200"
                >
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.total)} of {data.total} accounts
                        </div>
                        <div className="flex space-x-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    variant={page === currentPage ? 'primary' : 'secondary'}
                                    size="sm"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
} 