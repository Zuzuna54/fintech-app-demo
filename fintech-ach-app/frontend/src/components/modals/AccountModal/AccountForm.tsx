import React from 'react';
import { Account } from '@/types';
import { BankAccountType } from '@/types/accounts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trash2, Save } from 'lucide-react';
import { AccountFormData } from '@/types/forms';

interface AccountFormProps {
    formData: AccountFormData;
    account: Account;
    isSubmitting: boolean;
    isDeleting: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isInternalAccount: boolean;
    hasChanges: boolean;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    onChange: (field: keyof Account, value: string) => void;
    onDelete: () => Promise<void>;
}

export function AccountForm({
    formData,
    account,
    isSubmitting,
    isDeleting,
    canEdit,
    canDelete,
    isInternalAccount,
    hasChanges,
    onSubmit,
    onChange,
    onDelete
}: AccountFormProps): JSX.Element {

    const handleDelete = async (e: React.MouseEvent): Promise<void> => {
        e.preventDefault(); // Prevent form submission

        await onDelete();
    };

    return (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
            <Input
                label="Account Name"
                value={formData.name ?? ''}
                onChange={(e) => onChange('name', e.target.value)}
                disabled={!canEdit}
            />

            {canEdit && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Account Type
                    </label>
                    <select
                        value={formData.account_type ?? ''}
                        onChange={(e) => onChange('account_type', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={!canEdit}
                    >
                        {isInternalAccount ? (
                            <>
                                <option value={BankAccountType.FUNDING}>Funding Account</option>
                                <option value={BankAccountType.CLAIMS}>Claims Account</option>
                            </>
                        ) : (
                            <>
                                <option value={BankAccountType.CHECKING}>Checking Account</option>
                                <option value={BankAccountType.SAVINGS}>Savings Account</option>
                            </>
                        )}
                    </select>
                </div>
            )}

            <div className="mt-4 rounded-md bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Account Number</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {account.account_number}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Routing Number</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {account.routing_number}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Balance</p>
                        <p className="mt-1 font-medium text-gray-900">
                            ${account.balance?.toLocaleString() ?? '0.00'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Created</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {new Date(account.created_at ?? '').toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {(canEdit || canDelete) && (
                <div className="flex justify-end space-x-3">
                    {canEdit && (
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            leftIcon={<Save className="h-4 w-4" />}
                            disabled={!hasChanges}
                        >
                            Update Account
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            type="button"
                            onClick={(e) => void handleDelete(e)}
                            isLoading={isDeleting}
                            variant="destructive"
                            leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                            Delete Account
                        </Button>
                    )}
                </div>
            )}
        </form>
    );
} 