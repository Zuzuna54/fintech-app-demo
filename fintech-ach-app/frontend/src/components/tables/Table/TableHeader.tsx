import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Column, SortConfig } from '@/types/table';

interface TableHeaderProps {
    columns: Column[];
    sortConfig?: SortConfig;
    onSort?: (column: Column) => void;
}

export function TableHeader({ columns, sortConfig, onSort }: TableHeaderProps): JSX.Element {
    const handleSort = (column: Column): void => {
        if (!column.sortable || !onSort) return;
        onSort(column);
    };

    const renderSortIcon = (column: Column): React.ReactNode => {
        if (!column.sortable) return null;

        const isActive = sortConfig?.key === column.accessor;
        const isAsc = sortConfig?.direction === 'asc';

        return (
            <div className={`
                inline-flex transition-colors duration-200
                ${isActive ? 'text-blue-600' : 'text-gray-400 opacity-0 group-hover:opacity-100'}
            `}>
                {isActive && !isAsc ? (
                    <ChevronDownIcon className="h-4 w-4" />
                ) : (
                    <ChevronUpIcon className="h-4 w-4" />
                )}
            </div>
        );
    };

    return (
        <thead className="sticky top-0 z-20">
            <tr>
                {columns.map((column, idx) => (
                    <th
                        key={idx}
                        scope="col"
                        onClick={() => handleSort(column)}
                        className={`
                            bg-gray-50
                            px-6 py-3 
                            text-left text-xs font-medium 
                            uppercase tracking-wider text-gray-500 
                            first:pl-8 last:pr-8
                            ${column.sortable ? 'cursor-pointer group hover:bg-gray-100' : ''}
                            transition-colors duration-200
                        `}
                        style={{
                            position: 'sticky',
                            top: 0,
                            backgroundColor: 'rgb(249, 250, 251)'
                        }}
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