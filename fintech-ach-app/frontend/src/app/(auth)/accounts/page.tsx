'use client';

import React, { type ReactElement, useState, useCallback } from 'react';
import useSWR from 'swr';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import type { Column, SortConfig } from '@/types/table';
import { UserRole } from '@/types/auth';
import type { AccountsResponse, Account } from '@/types';
import { fetcher } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth, withAuth } from '@/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { AccountModal } from '@/components/modals/AccountModal';
import { AccountsHeader } from './components/AccountsHeader';
import { AccountsTabs } from './components/AccountsTabs';
import { InternalAccountsTab } from './components/InternalAccountsTab';
import { ExternalAccountsTab } from './components/ExternalAccountsTab';

const columns: Column<Account>[] = [
    { header: 'Name', accessor: 'name', type: 'text', sortable: true },
    { header: 'Account Type', accessor: 'account_type', type: 'text', sortable: true },
    { header: 'Balance', accessor: 'balance', type: 'currency', sortable: true },
    { header: 'Status', accessor: 'status', type: 'status', sortable: true },
    { header: 'Created', accessor: 'created_at', type: 'date', sortable: true }
];

function AccountsPage(): ReactElement {
    const [showInternalForm, setShowInternalForm] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentInternalPage, setCurrentInternalPage] = useState(1);
    const [currentExternalPage, setCurrentExternalPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'created_at',
        direction: 'desc'
    });
    const pageSize = 10;
    const { user } = useAuth();
    const isSuperUser = user?.role === UserRole.SUPERUSER;
    const isOrgAdmin = user?.role === UserRole.ORGANIZATION_ADMIN;

    // Construct query parameters based on selected tab
    const queryParams = new URLSearchParams();
    queryParams.append('limit', pageSize.toString());
    queryParams.append('sort_by', String(sortConfig.key));
    queryParams.append('sort_direction', sortConfig.direction?.toString() ?? '');

    // Add tab-specific parameters
    if (selectedTab === 0 && isSuperUser) {
        queryParams.append('offset', ((currentInternalPage - 1) * pageSize).toString());
    } else {
        queryParams.append('offset', ((currentExternalPage - 1) * pageSize).toString());
        if (isOrgAdmin && user?.organization_id) {
            queryParams.append('organization_id', user.organization_id);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: accountsData, error, mutate: mutateAccounts } = useSWR<AccountsResponse>(
        `/accounts?${queryParams.toString()}`,
        fetcher,
        {
            keepPreviousData: true,
            revalidateOnFocus: false
        }
    );

    const handleSort = useCallback((newSortConfig: SortConfig): void => {
        setSortConfig(newSortConfig);
        setCurrentInternalPage(1);
        setCurrentExternalPage(1);
    }, []);

    const handleInternalPageChange = useCallback((page: number): void => {
        setCurrentInternalPage(page);
    }, []);

    const handleExternalPageChange = useCallback((page: number): void => {
        setCurrentExternalPage(page);
    }, []);

    const handleAccountClick = useCallback((account: Account): void => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    }, []);

    const handleModalClose = useCallback((): void => {
        setIsModalOpen(false);
        setSelectedAccount(null);
    }, []);

    const handleInternalAccountSuccess = useCallback(async (): Promise<void> => {
        setShowInternalForm(false);
        await mutateAccounts();
    }, [mutateAccounts]);

    const handleSuccess = useCallback(async (): Promise<void> => {
        await mutateAccounts();
    }, [mutateAccounts]);

    const handleToggleInternalForm = useCallback((): void => {
        setShowInternalForm(prev => !prev);
    }, []);

    const handleTabChange = useCallback((index: number): void => {
        setSelectedTab(index);
        // Reset page numbers when switching tabs
        if (index === 0) {
            setCurrentExternalPage(1);
        } else {
            setCurrentInternalPage(1);
        }
        void mutateAccounts();
    }, [mutateAccounts]);

    const handlePlaidSuccess = useCallback(async (): Promise<void> => {
        await mutateAccounts();
    }, [mutateAccounts]);

    const handlePlaidError = useCallback((error: Error): void => {
        console.error('Plaid link error:', error);
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <ErrorMessage message="Failed to load accounts" />
            </div>
        );
    }

    if (!accountsData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <LoadingSpinner size="large" text="Loading..." />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex min-h-screen bg-gray-50"
            >
                <main className="flex-1 p-8">
                    <AccountsHeader
                        isSuperUser={isSuperUser}
                        isOrgAdmin={isOrgAdmin}
                        selectedTab={selectedTab}
                        showInternalForm={showInternalForm}
                        organizationId={user?.organization_id ?? undefined}
                        onToggleInternalForm={handleToggleInternalForm}
                        onPlaidSuccess={handlePlaidSuccess}
                        onPlaidError={handlePlaidError}
                    />

                    <AccountsTabs
                        isSuperUser={isSuperUser}
                        isOrgAdmin={isOrgAdmin}
                        onChange={handleTabChange}
                        defaultIndex={isOrgAdmin ? 0 : 0}
                    >
                        {isSuperUser && (
                            <Tab.Panel>
                                <InternalAccountsTab
                                    showInternalForm={showInternalForm}
                                    data={accountsData.internal_accounts ?? { accounts: [], total: 0 }}
                                    columns={columns}
                                    currentPage={currentInternalPage}
                                    pageSize={pageSize}
                                    sortConfig={sortConfig}
                                    onInternalAccountSuccess={handleInternalAccountSuccess}
                                    onAccountClick={handleAccountClick}
                                    onSort={handleSort}
                                    onPageChange={handleInternalPageChange}
                                />
                            </Tab.Panel>
                        )}
                        <Tab.Panel>
                            <ExternalAccountsTab
                                data={accountsData.external_accounts ?? { accounts: [], total: 0 }}
                                columns={columns}
                                currentPage={currentExternalPage}
                                pageSize={pageSize}
                                sortConfig={sortConfig}
                                isOrgAdmin={isOrgAdmin}
                                onAccountClick={handleAccountClick}
                                onSort={handleSort}
                                onPageChange={handleExternalPageChange}
                            />
                        </Tab.Panel>
                    </AccountsTabs>
                </main>

                <AccountModal
                    account={selectedAccount}
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSuccess={() => {
                        void handleSuccess();
                    }}
                    onError={(error) => {
                        console.error('Account update failed:', error);
                    }}
                />
            </motion.div>
        </ErrorBoundary>
    );
}

export default withAuth(AccountsPage, {
    requireAuth: true,
    allowedRoles: [UserRole.SUPERUSER, UserRole.ORGANIZATION_ADMIN]
}); 