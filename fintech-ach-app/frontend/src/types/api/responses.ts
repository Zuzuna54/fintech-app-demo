import { User } from '../auth';
import { Organization } from './organization';
import { Account } from './account';
import { Payment } from './payment';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    limit: number;
    offset: number;
}

export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, unknown>;
}

// User Responses
export interface UsersResponse extends PaginatedResponse<User> {
    data: User[];
}

export interface UserResponse {
    user: User;
}

// Organization Responses
export interface OrganizationsResponse extends PaginatedResponse<Organization> {
    organizations: Organization[];
}

export interface OrganizationResponse {
    organization: Organization;
}

// Account Responses
export interface AccountsResponse extends PaginatedResponse<Account> {
    accounts: Account[];
}

export interface AccountResponse {
    account: Account;
}

// Payment Responses
export interface PaymentsResponse extends PaginatedResponse<Payment> {
    payments: Payment[];
}

export interface PaymentResponse {
    payment: Payment;
} 