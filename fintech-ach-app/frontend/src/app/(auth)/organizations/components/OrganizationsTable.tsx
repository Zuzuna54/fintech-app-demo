import React from 'react';
import { motion } from 'framer-motion';
import { Table } from '@/components/tables/Table';
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm"
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
                currentPage={currentPage}
                pageSize={pageSize}
                sortConfig={sortConfig}
                onSort={onSort}
                onPageChange={onPageChange}
                onRowClick={(item) => {
                    if ('name' in item && 'description' in item) {
                        onRowClick(item);
                    }
                }}
            />
        </motion.div>
    );
} 