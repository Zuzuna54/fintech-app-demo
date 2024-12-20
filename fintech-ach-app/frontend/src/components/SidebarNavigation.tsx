'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/auth';
import { UserRole } from '@/types/auth';
import { Menu, X, LogOut } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { motion } from 'framer-motion';

type NavLink = {
    name: string;
    path: string;
};

interface SidebarNavigationProps {
    links: readonly NavLink[];
}

export function SidebarNavigation({ links }: SidebarNavigationProps): ReactElement {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const handleNavigation = (path: string): void => {
        if (pathname === path) return;
        setIsOpen(false);
        router.push(path);
    };

    const handleLogout = async (): Promise<void> => {
        try {
            await logout();
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-200"
                type="button"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <nav
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 h-screen bg-gray-900
                    transform transition-transform duration-200 ease-in-out
                    lg:transform-none lg:opacity-100
                    ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'}
                `}
            >
                <div className="flex flex-col h-full">
                    <div className="flex-1 p-6 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mb-8"
                        >
                            <h1 className="text-2xl font-bold text-white">
                                {user?.role === UserRole.SUPERUSER ? 'Admin Panel' : 'Organization Panel'}
                            </h1>
                            <p className="text-sm text-gray-400 mt-1">
                                {user?.email}
                            </p>
                        </motion.div>

                        <ul className="space-y-2">
                            {links.map((link, index) => (
                                <motion.li
                                    key={link.path}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleNavigation(link.path)}
                                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${pathname === link.path
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        type="button"
                                    >
                                        {link.name}
                                    </motion.button>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="p-6 border-t border-gray-700"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => void handleLogout()}
                            className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors duration-200 group"
                            type="button"
                        >
                            <LogOut className="w-5 h-5 mr-2 transition-transform group-hover:rotate-12" />
                            <span>Logout</span>
                        </motion.button>
                    </motion.div>
                </div>
            </nav>
        </>
    );
} 