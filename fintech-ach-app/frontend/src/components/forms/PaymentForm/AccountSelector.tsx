import React from 'react';
import { Account } from '@/types';

interface AccountSelectorProps {
    label: string;
    accounts: Account[];
    value: string;
    onChange: (accountId: string) => void;
    disabled?: boolean;
    error?: string;
}

export function AccountSelector({
    label,
    accounts,
    value,
    onChange,
    disabled,
    error
}: AccountSelectorProps): JSX.Element {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${error ? 'border-red-300' : 'border-gray-300'
                    }`}
            >
                <option value="">Select account</option>
                {accounts.map((account) => (
                    <option key={account.uuid} value={account.uuid}>
                        {account.name} ({account.account_type})
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
} 