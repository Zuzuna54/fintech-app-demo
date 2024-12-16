import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Whether to add padding to the card */
    padded?: boolean;
}

/**
 * Card container component.
 * Used to group related content with a consistent style.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(({
    className,
    padded = true,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                'rounded-lg border border-gray-200 bg-white shadow-sm',
                padded && 'p-6',
                className
            )}
            {...props}
        />
    );
});

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

/**
 * Card header component.
 * Used to display a title and optional description at the top of a card.
 */
const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
    className,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={cn('mb-4 space-y-1.5', className)}
            {...props}
        />
    );
});

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

/**
 * Card title component.
 * Used as the main heading within a card.
 */
const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(({
    className,
    ...props
}, ref) => {
    return (
        <h3
            ref={ref}
            className={cn('font-semibold leading-none tracking-tight', className)}
            {...props}
        />
    );
});

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

/**
 * Card description component.
 * Used to provide additional context below the card title.
 */
const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(({
    className,
    ...props
}, ref) => {
    return (
        <p
            ref={ref}
            className={cn('text-sm text-gray-500', className)}
            {...props}
        />
    );
});

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

/**
 * Card content component.
 * Container for the main content of a card.
 */
const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({
    className,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={cn('', className)}
            {...props}
        />
    );
});

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

/**
 * Card footer component.
 * Used for actions or additional information at the bottom of a card.
 */
const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({
    className,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={cn('mt-4 flex items-center', className)}
            {...props}
        />
    );
});

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }; 