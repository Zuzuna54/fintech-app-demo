import React from 'react';
import { Table } from '@/components/tables/Table';
import { AnimatedTableContainer } from '@/components/tables/Table/AnimatedTableContainer';
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
    return (
        <AnimatedTableContainer
            currentPage={currentPage}
            pageSize={pageSize}
            total={data.total}
            onPageChange={onPageChange}
        >
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
            </div>
        </AnimatedTableContainer>
    );
} 