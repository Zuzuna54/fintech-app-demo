import React from 'react';
import { Table } from '@/components/tables/Table';
import { AnimatedTableContainer } from '@/components/tables/Table/AnimatedTableContainer';
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
    return (
        <AnimatedTableContainer
            currentPage={currentPage}
            pageSize={pageSize}
            total={data.total}
            onPageChange={onPageChange}
        >
            <Table
                columns={columns}
                data={{
                    payments: data.payments,
                    total: data.total,
                    limit: pageSize,
                    offset: (currentPage - 1) * pageSize
                }}
                type="payments"
                sortConfig={sortConfig}
                onSort={onSort}
            />
        </AnimatedTableContainer>
    );
} 