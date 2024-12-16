import React from 'react';
import { Column, SortConfig } from '@/types/table';
import { Payment, PaymentsData } from '@/types/payments';
import { Account, AccountsData } from '@/types/accounts';
import { Organization, OrganizationsData } from '@/types/api';
import { User } from '@/types';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableFooter } from './TableFooter';
import { EmptyState } from './EmptyState';

interface UsersData {
    users: User[];
    total: number;
}

export interface TableProps {
    columns: Column[];
    data: AccountsData | PaymentsData | OrganizationsData | UsersData;
    type: 'internal_accounts' | 'external_accounts' | 'payments' | 'organizations' | 'users';
    onRowClick?: (item: Account | Payment | Organization | User) => void;
    sortConfig?: SortConfig;
    onSort?: (config: SortConfig) => void;
}

export function Table({
    columns,
    data,
    type,
    onRowClick,
    sortConfig,
    onSort
}: TableProps): JSX.Element {
    const items = type === 'organizations'
        ? (data as OrganizationsData).organizations
        : type === 'payments'
            ? (data as PaymentsData).payments
            : type === 'users'
                ? (data as UsersData).users
                : (data as AccountsData).accounts;

    const total = data.total;

    const handleSort = (column: Column): void => {
        if (!column.sortable || !onSort) return;

        const key = column.accessor;
        const direction = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        onSort({ key, direction });
    };

    if (!items?.length) {
        return <EmptyState columns={columns} type={type} total={total} />;
    }

    return (
        <div className="relative">
            <div className="h-[480px] overflow-auto relative">
                <div className="sticky top-0 z-20 bg-white">
                    <TableHeader
                        columns={columns}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <TableBody
                        columns={columns}
                        items={items}
                        onRowClick={onRowClick}
                    />
                </table>
            </div>
            <div className="sticky bottom-0 w-full bg-white z-10 border-t border-gray-200">
                <TableFooter total={total} type={type} />
            </div>
        </div>
    );
} 