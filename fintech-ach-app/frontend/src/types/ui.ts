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

export interface StatusSelectProps {
    value: string;
    onChange: (value: string) => void;
}

export interface PaymentTypeSelectorProps {
    value: 'ach_debit' | 'ach_credit';
    onChange: (type: 'ach_debit' | 'ach_credit') => void;
    disabled?: boolean;
}

export interface PaymentFiltersProps {
    filters: {
        startDate?: string;
        endDate?: string;
        status?: string;
        type?: string;
        minAmount?: number;
        maxAmount?: number;
    };
    onChange: (filters: PaymentFiltersProps['filters']) => void;
} 