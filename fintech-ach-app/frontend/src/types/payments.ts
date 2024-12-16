import { Account } from './accounts';

export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentType {
    CREDIT = 'ach_credit',
    DEBIT = 'ach_debit'
}

export interface Payment {
    id: string;
    uuid: string;
    amount: number;
    status: PaymentStatus;
    source_account: Account;
    destination_account: Account;
    created_at: string;
    updated_at: string;
    description?: string;
    metadata?: Record<string, unknown>;
    payment_type: PaymentType;
}

export interface PaymentsData {
    payments: Payment[];
    total: number;
    limit: number;
    offset: number;
} 