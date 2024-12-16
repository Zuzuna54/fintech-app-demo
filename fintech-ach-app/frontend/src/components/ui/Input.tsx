import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Label text for the input */
    label?: string;
    /** Helper text to display below the input */
    helperText?: string;
    /** Error message to display */
    error?: string;
    /** Left icon or element */
    leftElement?: React.ReactNode;
    /** Right icon or element */
    rightElement?: React.ReactNode;
}

/**
 * Input component for text entry.
 * Supports labels, helper text, error states, and decorative elements.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
    className,
    type = 'text',
    label,
    helperText,
    error,
    leftElement,
    rightElement,
    disabled,
    id,
    ...props
}, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className={cn(
                        'block text-sm font-medium mb-1.5',
                        error ? 'text-red-600' : 'text-gray-700'
                    )}
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {leftElement && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {leftElement}
                    </div>
                )}
                <input
                    id={inputId}
                    type={type}
                    ref={ref}
                    disabled={disabled}
                    className={cn(
                        // Base styles
                        'flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
                        // Focus styles
                        'focus-visible:outline-none focus:ring-2',
                        // Disabled styles
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        // Error styles
                        error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                        // Padding adjustments for elements
                        leftElement && 'pl-10',
                        rightElement && 'pr-10',
                        className
                    )}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-description` : undefined}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {rightElement}
                    </div>
                )}
            </div>
            {(helperText || error) && (
                <p
                    id={error ? `${inputId}-error` : `${inputId}-description`}
                    className={cn(
                        'mt-1.5 text-sm',
                        error ? 'text-red-600' : 'text-gray-500'
                    )}
                >
                    {error || helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export { Input }; 