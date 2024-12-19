'use client';

import React, { useState, useCallback } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth, withAuth } from '@/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { UserRole } from '@/types/auth';
import { OrganizationsTable } from './components/OrganizationsTable';
import { OrganizationsHeader } from './components/OrganizationsHeader';
import { OrganizationModal } from '@/components/modals/OrganizationModal/OrganizationModal';
import type { Column, SortConfig } from '@/types/table';
import { OrganizationForm } from './components/OrganizationForm';
import type { Organization } from '@/types/api';
import { api, fetcher } from '@/lib/api';

const columns: Column<Organization>[] = [
    { header: 'Name', accessor: 'name', type: 'text', sortable: true },
    { header: 'Description', accessor: 'description', type: 'text', sortable: true },
    { header: 'Status', accessor: 'status', type: 'status', sortable: true },
    { header: 'Created', accessor: 'created_at', type: 'date', sortable: true },
    { header: 'Updated', accessor: 'updated_at', type: 'date', sortable: true }
];

function OrganizationsPage(): JSX.Element {
    const [showForm, setShowForm] = useState(false);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'created_at',
        direction: 'desc'
    });
    const pageSize = 10;
    const { user } = useAuth();

    const queryParams = new URLSearchParams();
    queryParams.append('limit', pageSize.toString());
    queryParams.append('offset', ((currentPage - 1) * pageSize).toString());
    queryParams.append('sort_by', String(sortConfig.key));
    queryParams.append('sort_direction', sortConfig.direction?.toString() ?? '');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data, error: organizationsError, mutate: mutateOrganizations } = useSWR<{
        organizations: Organization[];
        total: number;
    }, Error>(
        `/management/organizations?${queryParams.toString()}`,
        fetcher,
        {
            keepPreviousData: true,
            revalidateOnFocus: false
        }
    );

    const organizations = data?.organizations ?? [];

    const handlePageChange = useCallback((page: number): void => {
        setCurrentPage(page);
        void mutateOrganizations();
    }, [mutateOrganizations]);

    const handleSort = useCallback((newSortConfig: SortConfig): void => {
        if (newSortConfig.key !== sortConfig.key) {
            setCurrentPage(1);
        }
        setSortConfig(newSortConfig);
        void mutateOrganizations();
    }, [mutateOrganizations, sortConfig]);

    const handleOrganizationSuccess = useCallback((): void => {
        setShowForm(false);
        setSelectedOrganization(null);
        void mutateOrganizations();
    }, [mutateOrganizations]);

    const handleOrganizationClick = useCallback((organization: Organization): void => {
        setSelectedOrganization(organization);
        setIsModalOpen(true);
    }, []);

    const handleDeleteOrganization = useCallback(async (organization: Organization): Promise<void> => {
        try {
            await api.delete(`/management/organizations/${organization.id}`);
            void mutateOrganizations();
        } catch (error) {
            if (error instanceof Error && error.message.includes('foreign key constraint')) {
                alert('Cannot delete organization because it has associated bank accounts. Please remove all bank accounts first.');
            } else {
                console.error('Error deleting organization:', error);
                alert('Failed to delete organization. Please try again.');
            }
        }
    }, [mutateOrganizations]);

    const handleNewOrganization = useCallback((): void => {
        setShowForm(!showForm);
    }, [showForm]);

    if (organizationsError) {
        return <ErrorMessage message={organizationsError.message} />;
    }

    return (
        <ErrorBoundary>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="container mx-auto px-4 py-8 max-w-7xl"
            >
                <main className="space-y-6">
                    <OrganizationsHeader
                        showForm={showForm}
                        userRole={user?.role}
                        onToggleForm={handleNewOrganization}
                    />

                    <AnimatePresence>
                        {showForm && (
                            <OrganizationForm
                                key="organization-form"
                                organization={selectedOrganization ?? undefined}
                                onSuccess={handleOrganizationSuccess}
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {!data ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex justify-center items-center min-h-[400px]"
                            >
                                <LoadingSpinner size="large" text="Loading organizations..." />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <OrganizationsTable
                                    data={organizations}
                                    total={data.total}
                                    columns={columns}
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onPageChange={handlePageChange}
                                    onRowClick={handleOrganizationClick}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <OrganizationModal
                        organization={selectedOrganization}
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setSelectedOrganization(null);
                        }}
                        onDelete={(org) => void handleDeleteOrganization(org)}
                        onSuccess={() => void mutateOrganizations()}
                        userRole={user?.role}
                    />
                </main>
            </motion.div>
        </ErrorBoundary>
    );
}

export default withAuth(OrganizationsPage, {
    requireAuth: true,
    allowedRoles: [UserRole.SUPERUSER]
}); 