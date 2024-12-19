

export enum AccountStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

export enum BankAccountType {
    CHECKING = 'checking',
    SAVINGS = 'savings',
    FUNDING = 'funding',
    CLAIMS = 'claims'
}

export interface Account {
    /** Unique identifier for the account */
    id: string;
    /** UUID for the account */
    uuid: string;
    /** Name of the account */
    name: string;
    /** Type of account (internal or external) */
    account_type: BankAccountType;
    /** Account number */
    account_number?: string;
    /** Routing number */
    routing_number?: string;
    /** Account balance */
    balance?: number;
    /** Account status */
    status: AccountStatus;
    /** Organization ID the account belongs to */
    organization_id?: string;
    /** Creation timestamp */
    created_at?: string;
    /** Update timestamp */
    updated_at?: string;
    /** Plaid account ID */
    plaid_account_id?: string;
}

export interface AccountsResponse {
    internal_accounts?: {
        total: number;
        accounts: Account[];
    };
    external_accounts?: {
        total: number;
        accounts: Account[];
    };
}

/**
 * Account data with pagination info
 */
export interface AccountsData {
    accounts: Account[];
    total: number;
}
