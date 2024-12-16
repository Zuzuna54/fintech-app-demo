import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Column } from '@/types/table';
import { Account, Payment, Organization, User } from '@/types';

type TableItem = Account | Payment | Organization | User;

interface TableBodyProps {
    columns: Column[];
    items: TableItem[];
    onRowClick?: (item: TableItem) => void;
}

const hasId = (item: TableItem): item is TableItem & { id: string | number } => 'id' in item;
const hasUuid = (item: TableItem): item is TableItem & { uuid: string } => 'uuid' in item;

export function TableBody({ columns, items, onRowClick }: TableBodyProps): JSX.Element {
    const renderCellValue = (item: TableItem, column: Column): React.ReactNode => {
        if (column.cell) {
            return column.cell({ getValue: () => item[column.accessor as keyof TableItem], row: { original: item } });
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
        <tbody className="divide-y divide-gray-200 bg-white">
            <AnimatePresence>
                {items.map((item, index) => (
                    <motion.tr
                        key={hasId(item) ? item.id : index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            duration: 0.2,
                            delay: index * 0.05,
                            ease: [0.25, 0.1, 0.25, 1]
                        }}
                        whileHover={{ scale: 1.005 }}
                        onClick={() => onRowClick?.(item)}
                        className={`
                            relative
                            ${onRowClick ? 'cursor-pointer' : ''}
                            hover:bg-gray-50/50
                            group
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