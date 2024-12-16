import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to payments page
        await page.goto('/payments');
    });

    test('should display payments list', async ({ page }) => {
        // Check if payments table is visible
        await expect(page.locator('table')).toBeVisible();

        // Check if table headers are present
        const headers = ['UUID', 'From Account', 'To Account', 'Amount', 'Status'];
        for (const header of headers) {
            await expect(page.getByText(header)).toBeVisible();
        }
    });

    test('should create new payment', async ({ page }) => {
        // Click new payment button
        await page.getByText('New Payment').click();

        // Wait for form to appear
        const form = page.locator('form');
        await expect(form).toBeVisible();

        // Fill out payment form
        await page.selectOption('select[name="from_account"]', { index: 1 });
        await page.selectOption('select[name="to_account"]', { index: 1 });
        await page.fill('input[name="amount"]', '100.00');
        await page.fill('input[name="description"]', 'Test payment');

        // Submit form
        await page.getByText('Create Payment').click();

        // Wait for success message
        await expect(page.getByText('Payment created successfully')).toBeVisible();

        // Verify payment appears in table
        await expect(page.getByText('Test payment')).toBeVisible();
    });

    test('should show validation errors', async ({ page }) => {
        // Click new payment button
        await page.getByText('New Payment').click();

        // Submit empty form
        await page.getByText('Create Payment').click();

        // Check validation messages
        await expect(page.getByText('From account is required')).toBeVisible();
        await expect(page.getByText('To account is required')).toBeVisible();
        await expect(page.getByText('Amount is required')).toBeVisible();
    });

    test('should show error for insufficient funds', async ({ page }) => {
        // Click new payment button
        await page.getByText('New Payment').click();

        // Fill out form with large amount
        await page.selectOption('select[name="from_account"]', { index: 1 });
        await page.selectOption('select[name="to_account"]', { index: 1 });
        await page.fill('input[name="amount"]', '999999.00');

        // Submit form
        await page.getByText('Create Payment').click();

        // Check error message
        await expect(page.getByText('Insufficient funds')).toBeVisible();
    });

    test('should update payment status', async ({ page }) => {
        // Create a new payment
        await page.getByText('New Payment').click();
        await page.selectOption('select[name="from_account"]', { index: 1 });
        await page.selectOption('select[name="to_account"]', { index: 1 });
        await page.fill('input[name="amount"]', '100.00');
        await page.getByText('Create Payment').click();

        // Wait for status to change from PENDING
        await expect(page.getByText('COMPLETED')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Account Management', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to accounts page
        await page.goto('/accounts');
    });

    test('should display accounts list', async ({ page }) => {
        // Check if accounts table is visible
        await expect(page.locator('table')).toBeVisible();

        // Check if table headers are present
        const headers = ['ID', 'Name', 'Type', 'Balance', 'Status'];
        for (const header of headers) {
            await expect(page.getByText(header)).toBeVisible();
        }
    });

    test('should link bank account', async ({ page }) => {
        // Click link bank account button
        await page.getByText('Link Bank Account').click();

        // Mock Plaid Link iframe interaction
        await page.evaluate(() => {
            window.postMessage({
                action: 'plaid_link_success',
                metadata: {
                    public_token: 'test_public_token',
                    account: {
                        id: 'test_account_id',
                        name: 'Test Account',
                        mask: '1234',
                        type: 'checking'
                    }
                }
            }, '*');
        });

        // Wait for success message
        await expect(page.getByText('Account linked successfully')).toBeVisible();

        // Verify account appears in table
        await expect(page.getByText('Test Account')).toBeVisible();
    });

    test('should show account details', async ({ page }) => {
        // Click on an account row
        await page.getByText('Test Account').click();

        // Check if details modal is visible
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();

        // Verify account details
        await expect(modal.getByText('Account Details')).toBeVisible();
        await expect(modal.getByText('Balance:')).toBeVisible();
        await expect(modal.getByText('Status:')).toBeVisible();
    });
});

test.describe('Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
        // Start at payments page
        await page.goto('/payments');
        await expect(page.getByText('Payments')).toBeVisible();

        // Navigate to accounts
        await page.getByText('Accounts').click();
        await expect(page.url()).toContain('/accounts');
        await expect(page.getByText('External Accounts')).toBeVisible();

        // Navigate back to payments
        await page.getByText('Payments').click();
        await expect(page.url()).toContain('/payments');
    });
});

test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
        // Mock API error
        await page.route('**/api/payments', route => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'Internal server error' })
            });
        });

        // Navigate to payments
        await page.goto('/payments');

        // Check error message
        await expect(page.getByText('Failed to load payments')).toBeVisible();
    });

    test('should handle network errors', async ({ page }) => {
        // Simulate offline mode
        await page.context().setOffline(true);

        // Try to create payment
        await page.goto('/payments');
        await page.getByText('New Payment').click();
        await page.selectOption('select[name="from_account"]', { index: 1 });
        await page.selectOption('select[name="to_account"]', { index: 1 });
        await page.fill('input[name="amount"]', '100.00');
        await page.getByText('Create Payment').click();

        // Check error message
        await expect(page.getByText('Network error')).toBeVisible();

        // Restore online mode
        await page.context().setOffline(false);
    });
}); 