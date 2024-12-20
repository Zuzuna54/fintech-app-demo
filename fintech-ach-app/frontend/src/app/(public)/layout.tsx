'use client';

import React, { type ReactElement } from 'react';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}): ReactElement {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex min-h-full flex-col justify-center">
                {children}
            </div>
        </div>
    );
} 