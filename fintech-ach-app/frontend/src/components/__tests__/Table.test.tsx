import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Table } from '../Table';

describe('Table', () => {
    const mockData = [
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane', age: 25 }
    ];

    const mockColumns = ['id', 'name', 'age'] as Array<'id' | 'name' | 'age'>;

    it('renders table with data correctly', () => {
        render(<Table data={mockData} columns={mockColumns} />);

        // Check headers
        mockColumns.forEach(column => {
            const header = screen.getByText(column.charAt(0).toUpperCase() + column.slice(1));
            expect(header).toBeInTheDocument();
        });

        // Check data
        mockData.forEach(row => {
            Object.values(row).forEach(value => {
                expect(screen.getByText(value.toString())).toBeInTheDocument();
            });
        });
    });

    it('handles empty data array', () => {
        render(<Table data={[]} columns={mockColumns} />);

        // Should render empty state message
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
}); 