import React, { type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface AnimatedTableContainerProps {
    children: React.ReactNode;
    currentPage?: number;
    pageSize?: number;
    total?: number;
    onPageChange?: (page: number) => void;
}

export function AnimatedTableContainer({
    children,
    currentPage,
    pageSize,
    total,
    onPageChange
}: AnimatedTableContainerProps): ReactElement {
    const totalPages = total && pageSize ? Math.ceil(total / pageSize) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 1
            }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col"
        >
            {children}

            {totalPages > 1 && currentPage && pageSize && total && onPageChange && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="px-6 py-4 border-t border-gray-200 bg-white mt-auto"
                >
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} items
                        </div>
                        <motion.div
                            className="flex space-x-2"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                        >
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <motion.div
                                    key={page}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                >
                                    <Button
                                        onClick={() => onPageChange(page)}
                                        variant={page === currentPage ? 'primary' : 'secondary'}
                                        size="sm"
                                    >
                                        {page}
                                    </Button>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
} 