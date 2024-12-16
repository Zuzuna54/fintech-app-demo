import React from 'react';
import { EmptyStateProps } from '@/types/table';

export function EmptyState({ columns, type, total }: EmptyStateProps): JSX.Element {
    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            {columns.map((column, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className="bg-gray-50/75 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 first:pl-8 last:pr-8"
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-6 py-8 text-center text-sm text-gray-500"
                            >
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <svg
                                        className="h-8 w-8 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                    <span className="font-medium">No data available</span>
                                    <span className="text-gray-400">
                                        {type === 'payments'
                                            ? 'No payments found'
                                            : type === 'users'
                                                ? 'No users found'
                                                : 'No accounts found'}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="border-t border-gray-200 bg-gray-50/75 px-6 py-3">
                <div className="text-sm text-gray-500">
                    Total: <span className="font-medium">{total}</span>{' '}
                    {type === 'payments'
                        ? 'payments'
                        : type === 'users'
                            ? 'users'
                            : 'accounts'}
                </div>
            </div>
        </div>
    );
} 