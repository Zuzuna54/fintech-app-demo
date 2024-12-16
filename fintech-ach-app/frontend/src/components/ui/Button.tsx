import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Button variants that define different visual styles
 */
export const buttonVariants = {
    primary: 'bg-blue-600 text-white shadow hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200',
    outline: 'border border-gray-300 bg-white shadow-sm hover:bg-gray-50',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    link: 'text-blue-600 underline-offset-4 hover:underline'
} as const;

/**
 * Button sizes that define different dimensions
 */
export const buttonSizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-10 px-6',
    icon: 'h-9 w-9'
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual variant of the button */
    variant?: keyof typeof buttonVariants;
    /** Size variant of the button */
    size?: keyof typeof buttonSizes;
    /** Whether the button is in a loading state */
    isLoading?: boolean;
    /** Icon to display before the button text */
    leftIcon?: React.ReactNode;
    /** Icon to display after the button text */
    rightIcon?: React.ReactNode;
}

/**
 * Primary button component for user interaction.
 * Supports different variants, sizes, loading states, and icons.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    variant = 'primary',
    size = 'default',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
}, ref) => {
    return (
        <button
            className={cn(
                // Base styles
                'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                'focus-visible:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:pointer-events-none disabled:opacity-50',
                // Variant styles
                buttonVariants[variant],
                // Size styles
                buttonSizes[size],
                className
            )}
            ref={ref}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {!isLoading && leftIcon && (
                <span className="mr-2">{leftIcon}</span>
            )}
            {children}
            {!isLoading && rightIcon && (
                <span className="ml-2">{rightIcon}</span>
            )}
        </button>
    );
});

Button.displayName = 'Button';

export { Button }; 