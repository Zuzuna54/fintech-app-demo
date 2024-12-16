'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';

interface Props {
    /** The content to be wrapped by the error boundary */
    children: React.ReactNode;
    /** Optional fallback component to display when an error occurs */
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
    /** The error that was caught, if any */
    error: Error | null;
    /** The component stack where the error occurred */
    componentStack: string | null;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in their child
 * component tree, logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            error: null,
            componentStack: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            error,
            componentStack: error.stack || null
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log the error to an error reporting service
        console.error('Uncaught error:', error, errorInfo);
    }

    resetError = (): void => {
        this.setState({
            error: null,
            componentStack: null
        });
    };

    render(): React.ReactNode {
        const { error, componentStack } = this.state;
        const { children, fallback: FallbackComponent } = this.props;

        if (error) {
            if (FallbackComponent) {
                return <FallbackComponent error={error} resetError={this.resetError} />;
            }

            return (
                <div className="min-h-[200px] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-md mx-auto"
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    <CardTitle>Something went wrong</CardTitle>
                                </div>
                                <CardDescription>
                                    An error occurred while rendering this component
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-sm bg-red-50 text-red-700 p-3 rounded-md">
                                        {error.message}
                                    </div>
                                    {process.env.NODE_ENV === 'development' && componentStack && (
                                        <details className="text-xs text-gray-500">
                                            <summary className="cursor-pointer hover:text-gray-700">
                                                Stack trace
                                            </summary>
                                            <pre className="mt-2 whitespace-pre-wrap">
                                                {componentStack}
                                            </pre>
                                        </details>
                                    )}
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={this.resetError}
                                            variant="primary"
                                            leftIcon={<RefreshCcw className="h-4 w-4" />}
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            );
        }

        return children;
    }
} 