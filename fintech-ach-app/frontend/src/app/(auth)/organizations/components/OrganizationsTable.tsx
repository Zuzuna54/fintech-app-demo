import React from 'react';
import { Table } from '@/components/tables/Table';
import { AnimatedTableContainer } from '@/components/tables/Table/AnimatedTableContainer';
import type { Column, SortConfig } from '@/types/table';
import type { Organization } from '@/types/api';

interface OrganizationsTableProps {
    data: Organization[];
    total: number;
    columns: Column[];
    currentPage: number;
    pageSize: number;
    sortConfig: SortConfig;
    onSort: (sortConfig: SortConfig) => void;
    onPageChange: (page: number) => void;
    onRowClick: (organization: Organization) => void;
}

export function OrganizationsTable({
    data,
    total,
    columns,
    currentPage,
    pageSize,
    sortConfig,
    onSort,
    onPageChange,
    onRowClick
}: OrganizationsTableProps): JSX.Element {
    return (
        <AnimatedTableContainer
            currentPage={currentPage}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
        >
            <Table
                data={{
                    organizations: data,
                    total,
                    limit: pageSize,
                    offset: (currentPage - 1) * pageSize
                }}
                type="organizations"
                columns={columns}
                sortConfig={sortConfig}
                onSort={onSort}
                onRowClick={(item) => {
                    if ('name' in item && 'description' in item) {
                        onRowClick(item);
                    }
                }}
            />
        </AnimatedTableContainer>
    );
} 