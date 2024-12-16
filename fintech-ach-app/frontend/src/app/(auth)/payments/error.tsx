'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Error page component for the payments route.
 * Displays when an error occurs within the payments page or its children.
 */
export default function PaymentsError({
    error,
    reset
}: ErrorPageProps): JSX.Element {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Payments page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
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
                            An error occurred while loading the payments page
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-sm bg-red-50 text-red-700 p-3 rounded-md">
                                {error.message}
                            </div>
                            {process.env.NODE_ENV === 'development' && error.digest && (
                                <div className="text-xs text-gray-500">
                                    <div className="font-medium">Error ID: {error.digest}</div>
                                </div>
                            )}
                            <div className="flex justify-end space-x-2">
                                <Button
                                    onClick={() => router.push('/')}
                                    variant="outline"
                                    leftIcon={<Home className="h-4 w-4" />}
                                >
                                    Go home
                                </Button>
                                <Button
                                    onClick={() => reset()}
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