import { useState } from 'react';
import { api } from '@/lib/api';
import { UsePaymentFormProps, UsePaymentFormReturn, PaymentFormState, PaymentFormErrors } from '@/types/forms';
import { BankAccountType } from '@/types/accounts';
import { PaymentType } from '@/types/payments';
import { v4 as uuidv4 } from 'uuid';

const initialState: PaymentFormState = {
    paymentType: PaymentType.DEBIT,
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: ''
};

const initialErrors: PaymentFormErrors = {
    fromAccount: undefined,
    toAccount: undefined,
    amount: undefined,
    description: undefined
};

export function usePaymentForm({ onSuccess, onError, accounts }: UsePaymentFormProps): UsePaymentFormReturn {
    const [formState, setFormState] = useState<PaymentFormState>(initialState);
    const [errors, setErrors] = useState<PaymentFormErrors>(initialErrors);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: PaymentFormErrors = {};

        // Validate source account
        if (!formState.fromAccount) {
            newErrors.fromAccount = 'Source account is required';
        } else {
            const sourceAccount = accounts.find(acc => acc.uuid === formState.fromAccount);
            if (!sourceAccount) {
                newErrors.fromAccount = 'Invalid source account';
            } else if (formState.paymentType === PaymentType.DEBIT &&
                (sourceAccount.account_type !== BankAccountType.CHECKING &&
                    sourceAccount.account_type !== BankAccountType.SAVINGS)) {
                newErrors.fromAccount = 'Source account must be external (checking/savings) for ACH debit (pull)';
            } else if (formState.paymentType === PaymentType.CREDIT &&
                (sourceAccount.account_type !== BankAccountType.FUNDING &&
                    sourceAccount.account_type !== BankAccountType.CLAIMS)) {
                newErrors.fromAccount = 'Source account must be internal (funding/claims) for ACH credit (push)';
            }
        }

        // Validate destination account
        if (!formState.toAccount) {
            newErrors.toAccount = 'Destination account is required';
        } else {
            const destAccount = accounts.find(acc => acc.uuid === formState.toAccount);
            if (!destAccount) {
                newErrors.toAccount = 'Invalid destination account';
            } else if (formState.paymentType === PaymentType.DEBIT &&
                (destAccount.account_type !== BankAccountType.FUNDING &&
                    destAccount.account_type !== BankAccountType.CLAIMS)) {
                newErrors.toAccount = 'Destination account must be internal (funding/claims) for ACH debit (pull)';
            } else if (formState.paymentType === PaymentType.CREDIT &&
                (destAccount.account_type !== BankAccountType.CHECKING &&
                    destAccount.account_type !== BankAccountType.SAVINGS)) {
                newErrors.toAccount = 'Destination account must be external (checking/savings) for ACH credit (push)';
            }
        }

        if (formState.fromAccount === formState.toAccount) {
            newErrors.fromAccount = 'Source and destination accounts must be different';
            newErrors.toAccount = 'Source and destination accounts must be different';
        }

        // Validate amount
        if (!formState.amount) {
            newErrors.amount = 'Amount is required';
        } else {
            const amount = parseFloat(formState.amount);
            if (isNaN(amount) || amount <= 0) {
                newErrors.amount = 'Amount must be greater than 0';
            }
        }

        // Validate description
        if (!formState.description) {
            newErrors.description = 'Description is required';
        } else if (formState.description.length < 3) {
            newErrors.description = 'Description must be at least 3 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        // Run validation first
        if (!validateForm()) {
            // Show the errors to the user
            onError(new Error('Please fix the validation errors'));
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/payments', {
                payment_type: formState.paymentType,
                from_account_id: formState.fromAccount,
                to_account_id: formState.toAccount,
                amount: parseFloat(formState.amount) * 100, // Convert to cents
                description: formState.description,
                idempotency_key: uuidv4() // Add unique idempotency key for each request
            });
            onSuccess();
            // Reset form
            setFormState(initialState);
            setErrors(initialErrors);
        } catch (error) {
            if (error instanceof Error) {
                // Check for specific API error messages
                if (error.message.includes('not active')) {
                    const isSourceError = error.message.includes('Source');
                    const isDestError = error.message.includes('Destination');

                    setErrors(prev => ({
                        ...prev,
                        fromAccount: isSourceError ? 'Source account is not active' : undefined,
                        toAccount: isDestError ? 'Destination account is not active' : undefined
                    }));
                }
                onError(error);
            } else {
                onError(new Error('An unexpected error occurred'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    const handlePaymentTypeChange = (type: PaymentType): void => {
        setFormState(prev => ({
            ...prev,
            paymentType: type,
            fromAccount: '',
            toAccount: ''
        }));
        setErrors(initialErrors);
    };

    const handleFromAccountChange = (fromAccount: string): void => {
        setFormState(prev => ({ ...prev, fromAccount }));
        setErrors(prev => ({ ...prev, fromAccount: undefined }));
    };

    const handleToAccountChange = (toAccount: string): void => {
        setFormState(prev => ({ ...prev, toAccount }));
        setErrors(prev => ({ ...prev, toAccount: undefined }));
    };

    const handleAmountChange = (amount: string): void => {
        setFormState(prev => ({ ...prev, amount }));
        setErrors(prev => ({ ...prev, amount: undefined }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFormState(prev => ({ ...prev, description: e.target.value }));
        setErrors(prev => ({ ...prev, description: undefined }));
    };

    return {
        formState,
        errors,
        isSubmitting,
        handleSubmit,
        handlePaymentTypeChange,
        handleFromAccountChange,
        handleToAccountChange,
        handleAmountChange,
        handleDescriptionChange,
        validateForm
    };
} 