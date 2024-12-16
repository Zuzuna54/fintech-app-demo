import React from 'react';
import { Dialog } from '@headlessui/react';
import { DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAccountModal } from './useAccountModal';
import { Account, AccountStatus, BankAccountType } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface AccountModalProps {
    account: Account | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (error: Error) => void;
}

export function AccountModal({
    account,
    isOpen,
    onClose,
    onSuccess,
    onError
}: AccountModalProps): JSX.Element {
    const {
        formData,
        isSubmitting,
        isDeleting,
        canEdit,
        canDelete,
        isInternalAccount,
        hasChanges,
        handleChange,
        handleSubmit,
        handleDelete
    } = useAccountModal({
        account,
        onSuccess,
        onError,
        onClose
    });

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 z-50 overflow-y-auto"
        >
            <div className="flex min-h-screen items-center justify-center">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

                <Dialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-semibold">
                            {isInternalAccount ? 'Internal Account Details' : 'External Account Details'}
                        </Dialog.Title>
                        <Badge variant={formData.status === AccountStatus.ACTIVE ? 'success' : 'warning'}>
                            {formData.status?.toLowerCase()}
                        </Badge>
                    </div>

                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Account Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                value={formData.name ?? ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                disabled={!canEdit}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="account_type" className="block text-sm font-medium text-gray-700">
                                Account Type
                            </label>
                            <Select
                                id="account_type"
                                value={formData.account_type ?? ''}
                                onChange={(e) => handleChange('account_type', e.target.value)}
                                disabled={!canEdit}
                                className="mt-1"
                            >
                                {Object.values(BankAccountType).map((type) => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        {account && (
                            <>
                                <div>
                                    <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
                                        Account Number
                                    </label>
                                    <Input
                                        id="account_number"
                                        type="text"
                                        value={account.account_number ?? ''}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>

                                {account.routing_number && (
                                    <div>
                                        <label htmlFor="routing_number" className="block text-sm font-medium text-gray-700">
                                            Routing Number
                                        </label>
                                        <Input
                                            id="routing_number"
                                            type="text"
                                            value={account.routing_number}
                                            disabled
                                            className="mt-1 bg-gray-50"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <Select
                                        id="status"
                                        value={formData.status ?? ''}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                        disabled={!canEdit}
                                        className="mt-1"
                                    >
                                        {Object.values(AccountStatus).map((status) => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </>
                        )}

                        <div className="mt-6 flex justify-between">
                            {canEdit && (
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    disabled={!hasChanges || isSubmitting}
                                    className="inline-flex items-center space-x-2"
                                >
                                    <DocumentDuplicateIcon className="h-4 w-4" />
                                    <span>Update Account</span>
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => void handleDelete()}
                                    isLoading={isDeleting}
                                    className="inline-flex items-center space-x-2"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    <span>Delete Account</span>
                                </Button>
                            )}
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
} 