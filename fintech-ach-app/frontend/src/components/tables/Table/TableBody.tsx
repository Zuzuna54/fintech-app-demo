/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Column, TableItem } from '@/types/table';
// import { Account, Payment, Organization, User } from '@/types';



interface TableBodyProps {
    columns: Column<TableItem>[];
    items: TableItem[];
    onRowClick?: (item: TableItem) => void;
}

const hasId = (item: TableItem): item is TableItem & { id: string | number } => 'id' in item;
const hasUuid = (item: TableItem): item is TableItem & { uuid: string } => 'uuid' in item;
export function TableBody({ columns, items, onRowClick }: TableBodyProps): JSX.Element {
    const renderCellValue = (item: TableItem, column: Column<TableItem>): React.ReactNode => {
        if (column.cell) {
            return column.cell({ getValue: () => item[column.accessor], row: { original: item } });
        }

        const value = item[column.accessor as keyof TableItem];

        if (value === null || value === undefined) return '-';

        switch (column.type) {
            case 'currency':
                return (
                    <div className="flex items-center space-x-1">
                        <span className="text-gray-500">$</span>
                        <span className="font-medium tabular-nums text-gray-900">
                            {formatCurrency(Number(value)).replace('$', '')}
                        </span>
                    </div>
                );
            case 'date':
                return (
                    <span className="text-gray-500">
                        {formatDate(value as string | Date)}
                    </span>
                );
            case 'status':
                return (
                    <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${String(value).toLowerCase() === 'active' || String(value).toLowerCase() === 'completed'
                            ? 'bg-green-400'
                            : String(value).toLowerCase() === 'pending'
                                ? 'bg-yellow-400'
                                : String(value).toLowerCase() === 'processing'
                                    ? 'bg-blue-400'
                                    : String(value).toLowerCase() === 'failed'
                                        ? 'bg-red-400'
                                        : 'bg-gray-400'
                            }`} />
                        <Badge variant={getStatusBadgeVariant(String(value))}>
                            {String(value)}
                        </Badge>
                    </div>
                );
            default:
                return (
                    <span className="text-gray-900">
                        {String(value)}
                    </span>
                );
        }
    };

    return (
        <tbody className="bg-white">
            <AnimatePresence mode="wait">
                {items.map((item, index) => (
                    <motion.tr
                        // @ts-expect-error - Using index as fallback key when id/uuid not available
                        key={hasId(item) ? item.id : hasUuid(item) ? item.uuid : index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            mass: 1,
                            delay: index * 0.03
                        }}
                        onClick={() => onRowClick?.(item)}
                        className={`
                            ${onRowClick ? 'cursor-pointer' : ''}
                            group
                            transition-all duration-200 ease-out
                            hover:bg-gray-50
                            hover:shadow-md
                            hover:-translate-y-[2px]
                            hover:scale-[1.01]
                            hover:relative
                            hover:z-10
                        `}
                        style={{
                            transformOrigin: '50% 50%',
                            backfaceVisibility: 'hidden',
                            WebkitFontSmoothing: 'subpixel-antialiased'
                        }}
                    >
                        {columns.map((column, colIdx) => (
                            <td
                                key={colIdx}
                                className="whitespace-nowrap px-6 py-4 text-sm first:pl-8 last:pr-8"
                            >
                                {renderCellValue(item, column)}
                            </td>
                        ))}
                    </motion.tr>
                ))}
            </AnimatePresence>
        </tbody>
    );
} 