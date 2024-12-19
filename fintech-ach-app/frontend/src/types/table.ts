import { Account, AccountsData } from './accounts';
import { Payment, PaymentsData } from './payments';
import { Organization, OrganizationsData } from './api';
import { ExtendedUser, User } from './auth';


export interface Column<T> {
    header: string;
    accessor: keyof T;
    type?: 'currency' | 'date' | 'status' | 'text';
    sortable?: boolean;
    cell?: (props: { getValue: () => T[keyof T]; row: { original: T } }) => React.ReactNode;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T = Account | Payment | Organization | ExtendedUser | User> {
    key: keyof T;
    direction: SortDirection;
}

export interface TableHeaderProps<T = Account | Payment | Organization | ExtendedUser | User> {
    columns: Column<T>[];
    sortConfig?: SortConfig<T>;
    onSort?: (column: Column<T>) => void;
}

export interface TableBodyProps<T = Account | Payment | Organization | ExtendedUser> {
    columns: Column<T>[];
    items: T[];
    onRowClick?: (item: T) => void;
}

export interface TableFooterProps {
    total: number;
    type: 'internal_accounts' | 'external_accounts' | 'payments' | 'organizations' | 'users';
}

export interface EmptyStateProps<T = Account | Payment | Organization | ExtendedUser | User> {
    columns: Column<T>[];
    type: 'internal_accounts' | 'external_accounts' | 'payments' | 'organizations' | 'users';
    total: number;
}

export type TableItem = Account | Payment | Organization | User;

export type { AccountsData, PaymentsData, OrganizationsData };
