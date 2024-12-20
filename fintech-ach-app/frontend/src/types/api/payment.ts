export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    payment_type: PaymentType;
    description: string;
    from_account_id: string;
    to_account_id: string;
    created_at: string;
    updated_at: string | null;
    scheduled_date?: string;
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
    TRANSFER = 'TRANSFER',
    ACH = 'ACH'
}

export interface CreatePaymentDto {
    amount: number;
    payment_type: PaymentType;
    description: string;
    from_account_id: string;
    to_account_id: string;
    scheduled_date?: string;
}

export interface UpdatePaymentDto {
    status?: PaymentStatus;
    description?: string;
    scheduled_date?: string;
} 