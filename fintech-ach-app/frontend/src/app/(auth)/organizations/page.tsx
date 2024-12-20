'use client';

import React, { type ReactElement, useState, useCallback } from 'react';
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
import { useOrganizations, useCreateOrganization, useDeleteOrganization } from '@/hooks/api/useOrganizations';

const columns: Column<Organization>[] = [
    { header: 'Name', accessor: 'name', type: 'text', sortable: true },
    { header: 'Description', accessor: 'description', type: 'text', sortable: true },
    { header: 'Status', accessor: 'status', type: 'status', sortable: true },
    { header: 'Created', accessor: 'created_at', type: 'date', sortable: true },
    { header: 'Updated', accessor: 'updated_at', type: 'date', sortable: true }
];

function OrganizationsPage(): ReactElement {
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

    const { data: organizationsData, error: organizationsError, isLoading, mutate: refreshOrganizations } = useOrganizations({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction as 'asc' | 'desc'
    });

    const { mutate: createOrganization, isLoading: isSubmitting } = useCreateOrganization();
    const { mutate: deleteOrganization } = useDeleteOrganization();

    const handlePageChange = useCallback((page: number): void => {
        setCurrentPage(page);
    }, []);

    const handleSort = useCallback((newSortConfig: SortConfig): void => {
        setSortConfig(newSortConfig);
        setCurrentPage(1);
    }, []);

    const handleOrganizationSuccess = useCallback((): void => {
        setShowForm(false);
        setSelectedOrganization(null);
        void refreshOrganizations();
    }, [refreshOrganizations]);

    const handleOrganizationClick = useCallback((organization: Organization): void => {
        setSelectedOrganization(organization);
        setIsModalOpen(true);
    }, []);

    const handleDeleteOrganization = useCallback(async (organization: Organization): Promise<void> => {
        if (!organization.id) return;
        try {
            await deleteOrganization({ organizationId: organization.id });
            void refreshOrganizations();
        } catch (error) {
            if (error instanceof Error && error.message.includes('foreign key constraint')) {
                alert('Cannot delete organization because it has associated bank accounts. Please remove all bank accounts first.');
            } else {
                console.error('Error deleting organization:', error);
                alert('Failed to delete organization. Please try again.');
            }
        }
    }, [deleteOrganization, refreshOrganizations]);

    const handleNewOrganization = useCallback((): void => {
        setShowForm(!showForm);
    }, [showForm]);

    if (organizationsError) {
        return <ErrorMessage message={organizationsError instanceof Error ? organizationsError.message : 'An error occurred'} />;
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
                                isSubmitting={isSubmitting}
                                onSubmit={async (formData) => {
                                    await createOrganization(formData);
                                    handleOrganizationSuccess();
                                }}
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {isLoading || !organizationsData ? (
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
                                    data={organizationsData.organizations}
                                    total={organizationsData.total}
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
                        onSuccess={() => void refreshOrganizations()}
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