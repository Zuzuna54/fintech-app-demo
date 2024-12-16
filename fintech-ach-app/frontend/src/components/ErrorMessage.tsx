'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';

interface ErrorMessageProps {
    message: string;
    className?: string;
    onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
    message,
    className = '',
    onRetry
}) => {
    return (
        <Card className={`bg-red-50 dark:bg-red-900/20 ${className}`}>
            <CardContent className="flex items-start p-4">
                <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
                <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-200">
                        {message}
                    </p>
                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-red-800 dark:text-red-300 hover:text-red-600 dark:hover:text-red-100"
                            leftIcon={<RefreshCw className="h-4 w-4" />}
                        >
                            Try again
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}; 