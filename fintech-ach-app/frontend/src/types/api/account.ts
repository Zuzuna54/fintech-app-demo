export interface Account {
    id: string;
    name: string;
    account_type: AccountType;
    account_number: string;
    routing_number: string;
    balance: number;
    currency: string;
    status: AccountStatus;
    organization_id: string;
    created_at: string;
    updated_at: string | null;
}

export enum AccountType {
    CHECKING = 'CHECKING',
    SAVINGS = 'SAVINGS',
    INTERNAL = 'INTERNAL',
    EXTERNAL = 'EXTERNAL'
}

export enum AccountStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING',
    SUSPENDED = 'SUSPENDED',
    CLOSED = 'CLOSED'
}

export interface CreateAccountDto {
    name: string;
    account_type: AccountType;
    account_number: string;
    routing_number: string;
    organization_id: string;
}

export interface UpdateAccountDto {
    name?: string;
    status?: AccountStatus;
    balance?: number;
} 