import React, { useState } from 'react';
import { StatusSelect } from './ui/StatusSelect';
import { AmountInput } from './ui/AmountInput';
import { PaymentFiltersProps } from '@/types/ui';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRangePicker } from './ui/DateRangePicker';
import { XCircleIcon } from '@heroicons/react/24/outline';

export function PaymentFilters({ filters, onChange }: PaymentFiltersProps): JSX.Element {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleChange = (field: keyof typeof filters, value: string): void => {
        setLocalFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        onChange(localFilters);
    };

    const handleReset = (): void => {
        const resetFilters = {
            status: '',
            startDate: '',
            endDate: '',
            minAmount: 0,
            maxAmount: 0
        };
        setLocalFilters(resetFilters as unknown as typeof filters);
        onChange(resetFilters as unknown as typeof filters);
    };

    const handleDateRangeChange = (startDate: string, endDate: string): void => {
        setLocalFilters(prev => ({
            ...prev,
            startDate,
            endDate
        }));
    };

    const hasActiveFilters = Object.values(localFilters).some(value =>
        value !== '' && value !== 0 && value !== undefined
    );

    return (
        <Card>
            <CardHeader className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between h-6">
                    <div className="flex items-center space-x-2">
                        <CardTitle className="text-sm">Filters</CardTitle>
                        <div className="w-16">
                            <AnimatePresence>
                                {hasActiveFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Badge variant="primary">
                                            Active
                                        </Badge>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="w-20 flex justify-end">
                        <AnimatePresence>
                            {hasActiveFilters && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleReset}
                                        leftIcon={<XCircleIcon className="h-3 w-3" />}
                                    >
                                        Reset
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <StatusSelect
                                value={localFilters.status ?? ''}
                                onChange={(value) => handleChange('status', value)}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <AmountInput
                                    label="Min Amount"
                                    value={localFilters.minAmount?.toString() ?? ''}
                                    onChange={(value) => handleChange('minAmount', value)}
                                />
                                <AmountInput
                                    label="Max Amount"
                                    value={localFilters.maxAmount?.toString() ?? ''}
                                    onChange={(value) => handleChange('maxAmount', value)}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="pt-0.5"
                        >
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Range
                            </label>
                            <DateRangePicker
                                startDate={localFilters.startDate ?? ''}
                                endDate={localFilters.endDate ?? ''}
                                onChange={handleDateRangeChange}
                            />
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex justify-end pt-2"
                    >
                        <Button type="submit">
                            Apply Filters
                        </Button>
                    </motion.div>
                </form>
            </CardContent>
        </Card>
    );
} 