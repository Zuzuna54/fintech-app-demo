import { Account } from '@/types/accounts';
import { AccountFormData } from '@/types/forms';
import { User } from '@/types/index';

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
    handleChange: (field: keyof Account, value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    handleDelete: () => Promise<void>;
}

export interface UserModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (error: Error) => void;
}

export type { AccountFormData };
