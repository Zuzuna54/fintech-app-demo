import { Account, AccountsData } from './accounts';
import { Payment, PaymentsData } from './payments';
import { Organization, OrganizationsData } from './api';
import { User } from './index';

export interface ExtendedUser extends User {
    uuid: string;
    name: string;
    organization?: {
        uuid: string;
    };
}

export interface Column {
    header: string;
    accessor: keyof Account | keyof Payment | keyof Organization | keyof ExtendedUser;
    type?: 'currency' | 'date' | 'status' | 'text';
    sortable?: boolean;
    cell?: (props: { getValue: () => any; row: { original: any } }) => React.ReactNode;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
    key: keyof Account | keyof Payment | keyof Organization | keyof ExtendedUser;
    direction: SortDirection;
}

export interface TableHeaderProps {
    columns: Column[];
    sortConfig?: SortConfig;
    onSort?: (column: Column) => void;
}

export interface TableBodyProps {
    columns: Column[];
    items: (Account | Payment | Organization | ExtendedUser)[];
    onRowClick?: (item: Account | Payment | Organization | ExtendedUser) => void;
}

export interface TableFooterProps {
    total: number;
    type: 'internal_accounts' | 'external_accounts' | 'payments' | 'organizations' | 'users';
}

export interface EmptyStateProps {
    columns: Column[];
    type: 'internal_accounts' | 'external_accounts' | 'payments' | 'organizations' | 'users';
    total: number;
}

export type { AccountsData, PaymentsData, OrganizationsData };