import React, { type ReactElement } from 'react';
import { TableFooterProps } from '@/types/table';

export function TableFooter({ total, type }: TableFooterProps): ReactElement {
    return (
        <div className="border-t border-gray-200 bg-gray-50/75 px-6 py-3 mt-auto">
            <div className="text-sm text-gray-500">
                Total: <span className="font-medium">{total}</span>{' '}
                {type === 'payments' ? 'payments' : 'accounts'}
            </div>
        </div>
    );
} 