'use client';

import { useState, useCallback } from 'react';

interface UseModalReturn<T> {
    isOpen: boolean;
    selectedItem: T | null;
    openModal: (item?: T) => void;
    closeModal: () => void;
}

export function useModal<T>(): UseModalReturn<T> {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);

    const openModal = useCallback((item?: T): void => {
        setSelectedItem(item ?? null);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback((): void => {
        setIsOpen(false);
        setSelectedItem(null);
    }, []);

    return {
        isOpen,
        selectedItem,
        openModal,
        closeModal
    };
} 