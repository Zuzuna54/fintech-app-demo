// /* eslint-disable @typescript-eslint/no-misused-promises */
'use client';

import React, { type ReactElement, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers } from '@/hooks/useUsers';
import { Account, User, Organization, Payment } from '@/types';
import { useAuth, withAuth } from '@/auth';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UsersHeader } from './components/UsersHeader';
import { UsersTable } from './components/UsersTable';
import { UserModal } from '@/components/modals/UserModal/UserModal';
import { UserForm } from './components/UserForm';
import { api } from '@/lib/api';
import type { SortConfig } from '@/types/table';

function UsersPage(): ReactElement {
    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [errors, setErrors] = useState({
        general: '',
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        organization_id: '',
        password: ''
    });
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'created_at',
        direction: 'desc'
    });
    const pageSize = 10;
    const { user } = useAuth();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: usersData, isLoading, error, mutate } = useUsers({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction ?? 'asc'
    });

    const handlePageChange = useCallback((page: number): void => {
        setCurrentPage(page);
    }, []);

    const handleSort = useCallback((newSortConfig: SortConfig): void => {
        setSortConfig(newSortConfig);
        setCurrentPage(1);
    }, []);

    const handleUserSuccess = useCallback(async (): Promise<void> => {
        setShowForm(false);
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            role: '',
            organization_id: '',
            password: ''
        });
        await mutate();
    }, [mutate]);

    const handleUserClick = useCallback((item: Account | Payment | Organization | User): void => {
        if ('email' in item && 'role' in item) {
            setSelectedUser(item);
            setIsModalOpen(true);
        }
    }, []);

    const handleDeleteUser = useCallback(async (user: User): Promise<void> => {
        try {
            await api.delete(`/management/users/${user.id}`);
            void mutate();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }, [mutate]);

    const handleNewUser = useCallback((): void => {
        setShowForm(!showForm);
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            role: '',
            organization_id: '',
            password: ''
        });
    }, [showForm]);

    const handleFormChange = (field: keyof typeof formData, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/management/users', formData);
            await handleUserSuccess();
            setShowForm(false);
        } catch (error: unknown) {
            console.error('Error creating user:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const response = error.response as { status?: number; data?: { detail?: string } };
                if (response?.status === 400 &&
                    typeof response?.data?.detail === 'string' &&
                    response.data.detail.includes('Email already registered')) {
                    setErrors(prev => ({
                        ...prev,
                        email: 'This email is already registered'
                    }));
                } else {
                    // Handle other errors
                    setErrors(prev => ({
                        ...prev,
                        general: 'Failed to create user. Please try again.'
                    }));
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (error) {
        return <ErrorMessage message={error instanceof Error ? error.message : 'An error occurred'} />;
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
                    <UsersHeader
                        showForm={showForm}
                        userRole={user?.role}
                        onToggleForm={handleNewUser}
                    />

                    <AnimatePresence>
                        {showForm && (
                            <UserForm
                                key="user-form"
                                formData={formData}
                                isSubmitting={isSubmitting}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    await handleFormSubmit(e);
                                }}
                                onChange={handleFormChange}
                                errors={{
                                    general: errors.general ?? '',
                                    email: errors.email ?? '',
                                    password: errors.password ?? ''
                                }}
                                setErrors={(newErrors) => setErrors({
                                    general: newErrors.general ?? '',
                                    email: newErrors.email ?? '',
                                    password: newErrors.password ?? ''
                                })}
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {isLoading || !usersData ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex justify-center items-center min-h-[400px]"
                            >
                                <LoadingSpinner size="large" text="Loading users..." />
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
                                <UsersTable
                                    data={usersData.data}
                                    total={usersData.total}
                                    onRowClick={handleUserClick}
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onPageChange={handlePageChange}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <UserModal
                        user={selectedUser}
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setSelectedUser(null);
                        }}
                        onDelete={async (user) => {
                            await handleDeleteUser(user);
                            await mutate();
                        }}
                        onSuccess={async () => {
                            await mutate();
                        }}
                        userRole={user?.role}
                    />
                </main>
            </motion.div>
        </ErrorBoundary>
    );
}

export default withAuth(UsersPage, {
    requireAuth: true,
    allowedRoles: [UserRole.SUPERUSER]
}); 