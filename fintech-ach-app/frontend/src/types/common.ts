/**
 * Common query parameters for API requests
 */
export interface QueryParams {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

// Note: Table-related types have been moved to @/components/tables/Table/table.ts