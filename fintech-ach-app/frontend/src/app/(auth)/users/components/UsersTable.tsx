import React from 'react';
import { Table } from '@/components/tables/Table';
import { AnimatedTableContainer } from '@/components/tables/Table/AnimatedTableContainer';
import { User, Organization, Account, Payment } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/auth';
import { UserRole } from '@/types/auth';
import type { Column, SortConfig } from '@/types/table';

interface CellInfo {
    row: {
        original: User & {
            organization?: Organization | null;
        };
    };
}

interface UsersTableProps {
    data: User[];
    total: number;
    onRowClick: (item: User | Organization | Account | Payment) => void;
    currentPage?: number;
    pageSize?: number;
    sortConfig?: SortConfig;
    onSort?: (config: SortConfig) => void;
    onPageChange?: (page: number) => void;
}

export function UsersTable({
    data,
    total,
    onRowClick,
    currentPage,
    pageSize,
    sortConfig,
    onSort,
    onPageChange
}: UsersTableProps): JSX.Element {
    const { user: currentUser } = useAuth();
    const canManageUsers = currentUser?.role === UserRole.SUPERUSER;

    const columns: Column[] = [
        {
            header: 'Name',
            accessor: 'first_name' as const,
            sortable: true,
            cell: (info: CellInfo) => (
                <div className="flex items-center">
                    <span className="font-medium text-gray-900">
                        {`${info.row.original.first_name ?? ''} ${info.row.original.last_name ?? ''}`}
                    </span>
                </div>
            ),
        },
        {
            header: 'Email',
            accessor: 'email' as const,
            sortable: true,
        },
        {
            header: 'Role',
            accessor: 'role' as const,
            sortable: true,
            cell: (info: CellInfo) => (
                <Badge variant="secondary">
                    {info.row.original.role}
                </Badge>
            ),
        },
        {
            header: 'Organization',
            accessor: 'organization' as const,
            sortable: true,
            cell: (info: CellInfo) => {
                const org = info.row.original.organization;
                return org?.name ?? 'N/A';
            },
        },
        {
            header: 'Created',
            accessor: 'created_at' as const,
            sortable: true,
            type: 'date',
            cell: (info: CellInfo) => {
                const date = info.row.original.created_at ?? new Date().toISOString();
                return new Date(date).toLocaleDateString();
            },
        },
    ];

    return (
        <AnimatedTableContainer
            currentPage={currentPage}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
        >
            <Table
                columns={columns}
                data={{ users: data, total }}
                type="users"
                onRowClick={canManageUsers ? onRowClick : undefined}
                sortConfig={sortConfig}
                onSort={onSort}
            />
        </AnimatedTableContainer>
    );
} 