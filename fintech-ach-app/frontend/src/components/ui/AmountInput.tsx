import React, { type ReactElement } from 'react';
import { Input } from './Input';

interface AmountInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
}

export function AmountInput({
    label = 'Amount',
    value,
    onChange,
    disabled,
    error
}: AmountInputProps): ReactElement {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newValue = e.target.value;
        // Only allow numbers and decimals
        if (/^\d*\.?\d*$/.test(newValue)) {
            onChange(newValue);
        }
    };

    return (
        <Input
            type="text"
            label={label}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            error={error}
            leftElement={
                <span className="text-gray-500">$</span>
            }
            placeholder="0.00"
        />
    );
} 