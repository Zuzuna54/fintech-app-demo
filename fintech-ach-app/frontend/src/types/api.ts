import { Payment } from './payments';

/**
 * API response for payments
 */
export interface PaymentsResponse {
    total: number;
    payments: Payment[];
    limit: number;
    offset: number;
}

/**
 * API response for organizations
 */
export interface OrganizationsResponse {
    organizations: Organization[];
    total: number;
}

/**
 * Generic API error response
 */
export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, unknown>;
}

export interface StructuredError {
    type: string;
    status?: number;
    url?: string;
    method?: string;
    message: string;
    timestamp: string;
}

export interface OrganizationsData {
    organizations: Organization[];
    total: number;
    limit: number;
    offset: number;
}

export interface Organization {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string | null;
}