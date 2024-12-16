import React from 'react';
import { PaymentStatus } from '@/types/payments';

interface StatusSelectProps {
    value: string;
    onChange: (value: string) => void;
}

export function StatusSelect({ value, onChange }: StatusSelectProps): JSX.Element {
    return (
        <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
            </label>
            <select
                id="status"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1.5 bg-white"
            >
                <option value="">All Statuses</option>
                {Object.values(PaymentStatus).map((status) => (
                    <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                    </option>
                ))}
            </select>
        </div>
    );
} 