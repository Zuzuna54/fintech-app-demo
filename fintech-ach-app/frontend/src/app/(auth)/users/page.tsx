'use client';

import React, { type ReactElement, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers, useCreateUser, useDeleteUser } from '@/hooks/api/useUsers';
import type { User, Organization, Account, Payment } from '@/types/api';
import { useAuth, withAuth } from '@/auth';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UsersHeader } from './components/UsersHeader';
import { UsersTable } from './components/UsersTable';
import { UserModal } from '@/components/modals/UserModal/UserModal';
import { UserForm } from './components/UserForm';
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

    const { data: usersData, error: usersError, isLoading, mutate: refreshUsers } = useUsers({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction as 'asc' | 'desc'
    });

    const { mutate: createUser, isLoading: isSubmitting } = useCreateUser();
    const { mutate: deleteUser } = useDeleteUser();

    const handlePageChange = useCallback((page: number): void => {
        setCurrentPage(page);
    }, []);

    const handleSort = useCallback((newSortConfig: SortConfig): void => {
        setSortConfig(newSortConfig);
        setCurrentPage(1);
    }, []);

    const handleUserSuccess = useCallback((): void => {
        setShowForm(false);
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            role: '',
            organization_id: '',
            password: ''
        });
        void refreshUsers();
    }, [refreshUsers]);

    const handleUserClick = useCallback((item: Account | Payment | Organization | User): void => {
        if ('email' in item && 'role' in item) {
            setSelectedUser(item);
            setIsModalOpen(true);
        }
    }, []);

    const handleFormChange = (field: keyof typeof formData, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            await createUser(formData);
            handleUserSuccess();
            setShowForm(false);
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message.includes('Email already registered')) {
                    setErrors(prev => ({
                        ...prev,
                        email: 'This email is already registered'
                    }));
                } else {
                    setErrors(prev => ({
                        ...prev,
                        general: 'Failed to create user. Please try again.'
                    }));
                }
            }
        }
    };

    const handleDeleteUser = useCallback(async (user: User): Promise<void> => {
        if (!user.id) return;
        try {
            await deleteUser({ userId: user.id });
            void refreshUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    }, [deleteUser, refreshUsers]);

    if (usersError) {
        return <ErrorMessage message={usersError instanceof Error ? usersError.message : 'An error occurred'} />;
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
                        onToggleForm={() => setShowForm(!showForm)}
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
                        onDelete={(user) => {
                            void handleDeleteUser(user).then(() => {
                                void refreshUsers();
                            });
                        }}
                        onSuccess={async () => {
                            await refreshUsers();
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