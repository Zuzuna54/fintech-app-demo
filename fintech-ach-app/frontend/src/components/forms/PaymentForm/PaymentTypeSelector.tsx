import React, { type ReactElement } from 'react';
import { Button } from '@/components/ui/Button';

interface PaymentTypeSelectorProps {
    value: 'ach_debit' | 'ach_credit';
    onChange: (type: 'ach_debit' | 'ach_credit') => void;
    disabled?: boolean;
}

export function PaymentTypeSelector({ value, onChange, disabled }: PaymentTypeSelectorProps): ReactElement {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Payment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    variant={value === 'ach_debit' ? 'primary' : 'outline'}
                    onClick={() => onChange('ach_debit')}
                    disabled={disabled}
                >
                    ACH Debit (Pull)
                </Button>
                <Button
                    type="button"
                    variant={value === 'ach_credit' ? 'primary' : 'outline'}
                    onClick={() => onChange('ach_credit')}
                    disabled={disabled}
                >
                    ACH Credit (Push)
                </Button>
            </div>
        </div>
    );
} 