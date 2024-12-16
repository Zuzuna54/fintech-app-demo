import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { TableHeaderProps, Column } from './table';

export function TableHeader({ columns, sortConfig, onSort }: TableHeaderProps): JSX.Element {
    const handleSort = (column: Column): void => {
        if (!column.sortable || !onSort) return;
        onSort(column);
    };

    const renderSortIcon = (column: Column): React.ReactNode => {
        if (!column.sortable) {
            return (
                <ChevronUpIcon
                    className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                />
            );
        }

        const icon = sortConfig?.key === column.accessor
            ? sortConfig.direction === 'asc'
                ? <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                : <ChevronDownIcon className="h-4 w-4 text-blue-600" />
            : <ChevronUpIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;

        return icon;
    };

    return (
        <thead className="bg-gray-50/75 sticky top-0 z-10">
            <tr>
                {columns.map((column, idx) => (
                    <th
                        key={idx}
                        scope="col"
                        onClick={() => handleSort(column)}
                        className={`
                            px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 first:pl-8 last:pr-8
                            ${column.sortable ? 'cursor-pointer group' : ''}
                        `}
                    >
                        <div className="flex items-center space-x-1">
                            <span>{column.header}</span>
                            {renderSortIcon(column)}
                        </div>
                    </th>
                ))}
            </tr>
        </thead>
    );
} 