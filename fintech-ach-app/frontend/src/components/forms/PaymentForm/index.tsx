import React from 'react';
import { PaymentFormProps } from '@/types/forms';
import { usePaymentForm } from './usePaymentForm';
import { PaymentTypeSelector } from './PaymentTypeSelector';
import { AccountSelector } from './AccountSelector';
import { AmountInput } from '@/components/ui/AmountInput';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { Send } from 'lucide-react';
import { BankAccountType } from '@/types/accounts';
import { PaymentType } from '@/types/payments';

export function PaymentForm({ accounts, onSuccess, onError }: PaymentFormProps): JSX.Element {
    const {
        formState,
        isSubmitting,
        handleSubmit,
        handlePaymentTypeChange,
        handleFromAccountChange,
        handleToAccountChange,
        handleAmountChange,
        handleDescriptionChange,
        errors
    } = usePaymentForm({ accounts, onSuccess, onError });

    // Filter accounts based on payment type
    const internalAccounts = accounts.filter(account =>
        account.account_type === BankAccountType.FUNDING ||
        account.account_type === BankAccountType.CLAIMS
    );
    const externalAccounts = accounts.filter(account =>
        account.account_type === BankAccountType.CHECKING ||
        account.account_type === BankAccountType.SAVINGS
    );

    // For ACH debit (pull), source is external and destination is internal
    // For ACH credit (push), source is internal and destination is external
    const fromAccountOptions = formState.paymentType === PaymentType.DEBIT ? externalAccounts : internalAccounts;
    const toAccountOptions = formState.paymentType === PaymentType.DEBIT ? internalAccounts : externalAccounts;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Payment</CardTitle>
                <CardDescription>
                    {formState.paymentType === PaymentType.DEBIT
                        ? 'Pull funds from an external account to an internal account'
                        : 'Push funds from an internal account to an external account'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(e); }} className="space-y-4">
                    <PaymentTypeSelector
                        value={formState.paymentType as PaymentType}
                        onChange={(type) => {
                            void handlePaymentTypeChange(type as PaymentType);
                        }}
                        disabled={isSubmitting}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AccountSelector
                            label={formState.paymentType === PaymentType.DEBIT
                                ? 'From Account (External)'
                                : 'From Account (Internal)'
                            }
                            accounts={fromAccountOptions}
                            value={formState.fromAccount}
                            onChange={handleFromAccountChange}
                            disabled={isSubmitting}
                            error={errors.fromAccount}
                        />

                        <AccountSelector
                            label={formState.paymentType === PaymentType.DEBIT
                                ? 'To Account (Internal)'
                                : 'To Account (External)'
                            }
                            accounts={toAccountOptions}
                            value={formState.toAccount}
                            onChange={handleToAccountChange}
                            disabled={isSubmitting}
                            error={errors.toAccount}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AmountInput
                            label="Amount"
                            value={formState.amount}
                            onChange={handleAmountChange}
                            disabled={isSubmitting}
                            error={errors.amount}
                        />

                        <Input
                            label="Description"
                            value={formState.description}
                            onChange={handleDescriptionChange}
                            disabled={isSubmitting}
                            placeholder="Payment description"
                            error={errors.description}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            leftIcon={<Send className="h-4 w-4" />}
                        >
                            Create Payment
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
} 