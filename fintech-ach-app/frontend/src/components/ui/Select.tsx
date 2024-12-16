import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    className?: string;
}

export function Select({ className, children, ...props }: SelectProps): JSX.Element {
    return (
        <select
            className={cn(
                'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
} 