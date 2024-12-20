import React, { type ReactElement } from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge variants that define different visual styles
 */
export const badgeVariants = {
    default: 'bg-gray-100 text-gray-800 ring-gray-200',
    primary: 'bg-blue-100 text-blue-800 ring-blue-200',
    secondary: 'bg-gray-100 text-gray-800 ring-gray-200',
    success: 'bg-green-100 text-green-800 ring-green-200',
    warning: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    error: 'bg-red-100 text-red-800 ring-red-200',
    info: 'bg-blue-100 text-blue-800 ring-blue-200'
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Visual variant of the badge */
    variant?: keyof typeof badgeVariants;
}

/**
 * Badge component for status indicators and labels.
 * Supports different variants for different types of status.
 */
export function Badge({
    className,
    variant = 'default',
    ...props
}: BadgeProps): ReactElement {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    );
}

/**
 * Maps a status string to an appropriate badge variant
 */
export function getStatusBadgeVariant(status: string): keyof typeof badgeVariants {
    const statusMap: Record<string, keyof typeof badgeVariants> = {
        active: 'success',
        completed: 'success',
        pending: 'warning',
        failed: 'error',
        error: 'error',
        inactive: 'secondary',
        processing: 'info'
    };

    return statusMap[status.toLowerCase()] || 'default';
} 