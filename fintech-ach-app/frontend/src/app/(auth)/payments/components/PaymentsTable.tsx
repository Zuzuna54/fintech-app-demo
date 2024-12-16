import React from 'react';
import { motion } from 'framer-motion';
import { Table } from '@/components/tables/Table';
import { Button } from '@/components/ui/Button';
import type { Column, SortConfig } from '@/types/table';
import type { Payment } from '@/types';

interface PaymentsTableProps {
    data: {
        payments: Payment[];
        total: number;
    };
    columns: Column[];
    currentPage: number;
    pageSize: number;
    sortConfig: SortConfig;
    onSort: (sortConfig: SortConfig) => void;
    onPageChange: (page: number) => void;
}

export function PaymentsTable({
    data,
    columns,
    currentPage,
    pageSize,
    sortConfig,
    onSort,
    onPageChange
}: PaymentsTableProps): JSX.Element {
    const totalPages = Math.ceil(data.total / pageSize);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm"
        >
            <Table
                columns={columns}
                data={{
                    ...data,
                    limit: pageSize,
                    offset: (currentPage - 1) * pageSize
                }}
                type="payments"
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
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.total)} of {data.total} payments
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
        </motion.div>
    );
} 