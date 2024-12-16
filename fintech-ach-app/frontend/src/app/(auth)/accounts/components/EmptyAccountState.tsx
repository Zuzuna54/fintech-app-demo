import React from 'react';
import { motion } from 'framer-motion';

interface EmptyAccountStateProps {
    title: string;
    message: string;
}

export function EmptyAccountState({ title, message }: EmptyAccountStateProps): JSX.Element {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12 bg-white rounded-lg shadow mb-8"
        >
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500">{message}</p>
        </motion.div>
    );
} 