'use client';

import { AuthProvider } from '@/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Metadata for the application
const metadata = {
    title: 'Fintech ACH App',
    description: 'Secure ACH payment processing platform',
    viewport: 'width=device-width, initial-scale=1',
    themeColor: '#000000',
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png'
    }
};

// Loading component for Suspense
function LoadingFallback(): JSX.Element {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-screen"
        >
            <LoadingSpinner className="w-8 h-8" />
        </motion.div>
    );
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}): JSX.Element {
    return (
        <html lang="en" className={inter.className}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#000000" />
                <meta name="description" content={metadata.description} />
                <title>{metadata.title}</title>
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            </head>
            <body>
                <ErrorBoundary>
                    <AuthProvider>
                        <Suspense fallback={<LoadingFallback />}>
                            <AnimatePresence mode="wait">
                                {children}
                            </AnimatePresence>
                        </Suspense>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
