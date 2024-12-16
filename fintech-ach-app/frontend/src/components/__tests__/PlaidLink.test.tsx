import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PlaidLink } from '../PlaidLink';
import { api } from '@/lib/api';

// Mock the Plaid Link component
let plaidLinkConfig: { onSuccess?: (token: string, metadata: unknown) => void } = {};
const mockOpen = jest.fn();
jest.mock('react-plaid-link', () => ({
    usePlaidLink: (config: { onSuccess?: (token: string, metadata: unknown) => void }) => {
        plaidLinkConfig = config;
        return {
            open: mockOpen,
            ready: true,
            error: null
        };
    }
}));

// Mock the api module
jest.mock('@/lib/api', () => ({
    api: {
        post: jest.fn()
    }
}));

describe('PlaidLink', () => {
    const mockOnSuccess = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        plaidLinkConfig = {};
    });

    it('renders correctly', () => {
        render(
            <PlaidLink
                organizationId={1}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        );

        expect(screen.getByRole('button')).toHaveTextContent(/link bank account/i);
    });

    it('handles successful account linking', async () => {
        const mockResponse = { data: { success: true } };
        (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

        render(
            <PlaidLink
                organizationId={1}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Simulate successful Plaid flow
        const mockPublicToken = 'mock-public-token';
        const mockMetadata = {
            accounts: [{
                id: 'test_account_id',
                mask: '1234'
            }]
        };

        await act(async () => {
            if (plaidLinkConfig.onSuccess) {
                await plaidLinkConfig.onSuccess(mockPublicToken, mockMetadata);
            }
        });

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/plaid/exchange_token', {
                public_token: mockPublicToken,
                organization_id: 1
            });
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    it('handles error during account linking', async () => {
        const mockError = new Error('Failed to link account');
        (api.post as jest.Mock).mockRejectedValueOnce(mockError);

        render(
            <PlaidLink
                organizationId={1}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Simulate successful Plaid flow but failed API call
        const mockPublicToken = 'mock-public-token';
        const mockMetadata = {
            accounts: [{
                id: 'test_account_id',
                mask: '1234'
            }]
        };

        await act(async () => {
            if (plaidLinkConfig.onSuccess) {
                await plaidLinkConfig.onSuccess(mockPublicToken, mockMetadata);
            }
        });

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/plaid/exchange_token', {
                public_token: mockPublicToken,
                organization_id: 1
            });
            expect(mockOnError).toHaveBeenCalledWith(mockError);
            expect(mockOnSuccess).not.toHaveBeenCalled();
        });
    });
}); 