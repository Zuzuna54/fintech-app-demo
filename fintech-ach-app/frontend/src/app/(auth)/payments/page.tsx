'use client';

import React, { useState, useCallback } from 'react';
import useSWR from 'swr';
import type { Column, SortConfig } from '@/types/table';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { AccountsResponse, PaymentsResponse } from '@/types';
import { fetcher } from '@/lib/api';
import { useAuth, withAuth } from '@/auth';
import { PaymentFilters } from '@/components/PaymentFilters';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { UserRole } from '@/types/auth';
import { PaymentsHeader } from './components/PaymentsHeader';
import { PaymentsTable } from './components/PaymentsTable';
import { PaymentFormSection } from './components/PaymentFormSection';

const columns: Column[] = [
    { header: 'Amount', accessor: 'amount', type: 'currency', sortable: true },
    { header: 'Status', accessor: 'status', type: 'status', sortable: true },
    { header: 'Description', accessor: 'description', type: 'text', sortable: true },
    { header: 'Payment Type', accessor: 'payment_type', type: 'text', sortable: true },
    { header: 'Created', accessor: 'created_at', type: 'date', sortable: true }
];

function PaymentsPage(): JSX.Element {
    const [showForm, setShowForm] = useState(false);
    const [filters, setFilters] = useState<{
        status?: string;
        startDate?: string;
        endDate?: string;
        minAmount?: number;
        maxAmount?: number;
    }>({
        status: '',
        startDate: '',
        endDate: '',
        minAmount: 0,
        maxAmount: 0
    });
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

    // Add filters
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.minAmount) queryParams.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount.toString());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
    const { data: accounts, error: accountsError } = useSWR<AccountsResponse>('/accounts', fetcher) ?? {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: payments, error: paymentsError, mutate: mutatePayments } = useSWR<PaymentsResponse>(
        `/payments?${queryParams.toString()}`,
        fetcher,
        {
            keepPreviousData: true,
            revalidateOnFocus: false
        }
    );

    const handleFilterChange = useCallback((newFilters: typeof filters): void => {
        setFilters(newFilters);
        setCurrentPage(1);
        void mutatePayments();
    }, [mutatePayments]);

    const handlePageChange = useCallback((page: number): void => {
        setCurrentPage(page);
        void mutatePayments();
    }, [mutatePayments]);

    const handlePaymentSuccess = useCallback((): void => {
        setShowForm(false);
        void mutatePayments();
    }, [mutatePayments]);

    const handleSort = useCallback((newSortConfig: SortConfig): void => {
        if (newSortConfig.key !== sortConfig.key) {
            setCurrentPage(1);
        }
        setSortConfig(newSortConfig);
        void mutatePayments();
    }, [mutatePayments, sortConfig]);

    if (paymentsError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <ErrorMessage message="Failed to load data" />
            </div>
        );
    }

    if (!payments) {
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
                <main className="flex-1 p-8 space-y-6">
                    <PaymentsHeader
                        showForm={showForm}
                        userRole={user?.role}
                        onToggleForm={() => setShowForm(!showForm)}
                    />

                    <PaymentFormSection
                        showForm={showForm}
                        accounts={[
                            ...(accounts?.internal_accounts?.accounts ?? []),
                            ...(accounts?.external_accounts?.accounts ?? [])
                        ]}
                        onSuccess={handlePaymentSuccess}
                        onError={(error) => {
                            console.error('Payment creation failed:', error);
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-white rounded-lg shadow-sm"
                    >
                        <PaymentFilters
                            filters={filters}
                            onChange={handleFilterChange}
                        />
                    </motion.div>

                    <PaymentsTable
                        data={payments}
                        columns={columns}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        onPageChange={handlePageChange}
                    />
                </main>
            </motion.div>
        </ErrorBoundary>
    );
}

export default withAuth(PaymentsPage, {
    requireAuth: true,
    allowedRoles: [UserRole.SUPERUSER, UserRole.ORGANIZATION_ADMIN]
}); 