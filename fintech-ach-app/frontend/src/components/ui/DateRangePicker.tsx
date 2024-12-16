import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChange: (startDate: string, endDate: string) => void;
}

type CalendarDate = {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isInRange: boolean;
    isRangeStart: boolean;
    isRangeEnd: boolean;
};

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent): void {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function updatePosition(): void {
            if (buttonRef.current && isOpen) {
                const buttonRect = buttonRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const calendarWidth = 600;

                let left = buttonRect.left;
                if (left + calendarWidth > viewportWidth - 20) {
                    left = Math.max(20, viewportWidth - calendarWidth - 20);
                }

                setPosition({
                    top: buttonRect.bottom + window.scrollY + 8,
                    left: left + window.scrollX
                });
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        updatePosition();

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const getCalendarDays = (month: Date): CalendarDate[] => {
        const start = new Date(month.getFullYear(), month.getMonth(), 1);
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const days: CalendarDate[] = [];

        // Add days from previous month
        const startDay = start.getDay();
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(start);
            date.setDate(start.getDate() - i - 1);
            days.push(createCalendarDate(date, false));
        }

        // Add days from current month
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            days.push(createCalendarDate(new Date(date), true));
        }

        // Add days from next month
        const lastDay = end.getDay();
        const remainingDays = 6 - lastDay;
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(end);
            date.setDate(end.getDate() + i);
            days.push(createCalendarDate(date, false));
        }

        return days;
    };

    const createCalendarDate = (date: Date, isCurrentMonth: boolean): CalendarDate => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T00:00:00') : null;
        const hovered = hoveredDate;

        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        const isSelected = Boolean(
            start?.getTime() === compareDate.getTime() ||
            end?.getTime() === compareDate.getTime()
        );

        let isInRange = false;
        if (start && end) {
            isInRange = compareDate >= start && compareDate <= end;
        } else if (start && hovered) {
            const hoveredCompare = new Date(hovered);
            hoveredCompare.setHours(0, 0, 0, 0);
            isInRange = compareDate >= start && compareDate <= hoveredCompare ||
                compareDate >= hoveredCompare && compareDate <= start;
        }

        return {
            date: compareDate,
            isCurrentMonth,
            isToday: compareDate.getTime() === today.getTime(),
            isSelected,
            isInRange,
            isRangeStart: start?.getTime() === compareDate.getTime(),
            isRangeEnd: end?.getTime() === compareDate.getTime()
        };
    };

    const handleDateClick = (date: Date): void => {
        const selectedDate = new Date(date);
        const dateStr = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];

        if (!startDate || (startDate && endDate)) {
            onChange(dateStr, '');
        } else {
            const start = new Date(startDate);
            if (selectedDate < start) {
                onChange(dateStr, startDate);
            } else {
                onChange(startDate, dateStr);
                setIsOpen(false);
            }
        }
    };

    const handleMonthChange = (increment: number): void => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + increment);
        setCurrentMonth(newMonth);
    };

    const formatDateRange = (): string => {
        if (!startDate && !endDate) {
            return 'Select date range';
        }

        const formatDate = (dateStr: string): string => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
            return `${MONTHS[adjustedDate.getMonth()].slice(0, 3)} ${adjustedDate.getDate()}`;
        };

        if (startDate && endDate) {
            return `${formatDate(startDate)} - ${formatDate(endDate)}`;
        }

        return startDate
            ? `From ${formatDate(startDate)}`
            : `Until ${formatDate(endDate)}`;
    };

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <Button
                ref={buttonRef}
                type="button"
                variant={startDate || endDate ? "primary" : "outline"}
                className={cn(
                    "w-full justify-start text-left font-normal",
                    startDate || endDate ? "border-blue-600 bg-white hover:bg-white text-gray-900" : ""
                )}
                onClick={handleButtonClick}
            >
                {formatDateRange()}
            </Button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="fixed bg-white rounded-lg shadow-xl z-[9999] border border-gray-200"
                            style={{
                                width: '600px',
                                top: position.top,
                                left: position.left
                            }}
                            ref={calendarRef}
                        >
                            <div className="p-4">
                                <div className="grid grid-cols-2 gap-8">
                                    {[0, 1].map((offset) => {
                                        const monthDate = new Date(currentMonth);
                                        monthDate.setMonth(monthDate.getMonth() + offset);
                                        const days = getCalendarDays(monthDate);

                                        return (
                                            <div key={offset} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
                                                    </span>
                                                    {offset === 0 && (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMonthChange(-1)}
                                                                className="p-1 hover:bg-gray-100 rounded-full"
                                                            >
                                                                <ChevronLeftIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMonthChange(1)}
                                                                className="p-1 hover:bg-gray-100 rounded-full"
                                                            >
                                                                <ChevronRightIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-7 gap-0">
                                                    {WEEKDAYS.map((day) => (
                                                        <div
                                                            key={day}
                                                            className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
                                                        >
                                                            {day}
                                                        </div>
                                                    ))}

                                                    {days.map((day, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleDateClick(day.date)}
                                                            onMouseEnter={() => setHoveredDate(day.date)}
                                                            onMouseLeave={() => setHoveredDate(null)}
                                                            className={cn(
                                                                "h-8 text-sm font-medium relative",
                                                                !day.isCurrentMonth && "text-gray-400",
                                                                day.isCurrentMonth && "text-gray-900",
                                                                day.isSelected && "text-white",
                                                                day.isInRange && !day.isSelected && "bg-blue-50",
                                                                (day.isRangeStart || day.isRangeEnd) && "bg-blue-600 text-white rounded-full",
                                                                "hover:bg-gray-100",
                                                                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                            )}
                                                        >
                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                {day.date.getDate()}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
} 