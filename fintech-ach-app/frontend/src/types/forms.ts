import { Account, AccountStatus, BankAccountType } from './accounts';
import { PaymentType } from './payments';
import { User } from './index';

export interface PaymentFormProps {
    accounts: Account[];
    onSuccess: () => void;
    onError: (error: Error) => void;
}

export interface PaymentFormState {
    paymentType: PaymentType;
    fromAccount: string;
    toAccount: string;
    amount: string;
    description: string;
}

export interface PaymentFormErrors {
    fromAccount?: string;
    toAccount?: string;
    amount?: string;
    description?: string;
}

export interface UsePaymentFormProps {
    accounts: Account[];
    onSuccess: () => void;
    onError: (error: Error) => void;
}

export interface UsePaymentFormReturn {
    formState: PaymentFormState;
    errors: PaymentFormErrors;
    isSubmitting: boolean;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handlePaymentTypeChange: (type: PaymentType) => void;
    handleFromAccountChange: (accountId: string) => void;
    handleToAccountChange: (accountId: string) => void;
    handleAmountChange: (amount: string) => void;
    handleDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validateForm: () => boolean;
}

export interface AccountFormData {
    name?: string;
    account_type?: BankAccountType;
    status?: AccountStatus;
}

export interface AccountModalProps {
    account: Account | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (error: Error) => void;
}

export interface UseAccountModalReturn {
    formData: AccountFormData;
    isSubmitting: boolean;
    isDeleting: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isInternalAccount: boolean;
    hasChanges: boolean;
    handleChange: (field: keyof Account, value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    handleDelete: () => Promise<void>;
}

export interface FormData {
    name: string;
    account_type: BankAccountType;
    routing_number: string;
    account_number: string;
    organization_id: string;
}

export interface FormErrors {
    name?: string;
    account_type?: string;
    routing_number?: string;
    account_number?: string;
    organization_id?: string;
}

export interface FormTouched {
    name?: boolean;
    account_type?: boolean;
    routing_number?: boolean;
    account_number?: boolean;
    organization_id?: boolean;
}

export interface UserFormData {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    organization_id: string | undefined;
    password: string;
}

export interface UseUserModalReturn {
    formData: UserFormData;
    isSubmitting: boolean;
    isDeleting: boolean;
    canEdit: boolean;
    canDelete: boolean;
    hasChanges: boolean;
    handleChange: (field: keyof User, value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    handleDelete: () => Promise<void>;
}