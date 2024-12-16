-- Create enum types
CREATE TYPE role AS ENUM ('superuser', 'organization_admin', 'organization_user');
CREATE TYPE bankaccounttype AS ENUM ('checking', 'savings', 'funding', 'claims');
CREATE TYPE accountstatus AS ENUM ('pending', 'active', 'suspended', 'closed');
CREATE TYPE paymentstatus AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Create Organizations
INSERT INTO organizations (id, name, description, status, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Tech Corp', 'Technology Corporation', 'active', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Finance Ltd', 'Financial Services Company', 'active', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Health Inc', 'Healthcare Organization', 'active', NOW(), NOW());

-- Create Users with different roles
INSERT INTO users (id, email, first_name, last_name, hashed_password, role, organization_id, is_active, created_at, updated_at)
VALUES
    -- Superusers
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'super.admin@example.com', 'Super', 'Admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJyqU1Ri', 'superuser', '11111111-1111-1111-1111-111111111111', true, NOW(), NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'super.user@example.com', 'Super', 'User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJyqU1Ri', 'superuser', '11111111-1111-1111-1111-111111111111', true, NOW(), NOW()),
    
    -- Organization Admins
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'tech.admin@example.com', 'Tech', 'Admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJyqU1Ri', 'organization_admin', '11111111-1111-1111-1111-111111111111', true, NOW(), NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'finance.admin@example.com', 'Finance', 'Admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJyqU1Ri', 'organization_admin', '22222222-2222-2222-2222-222222222222', true, NOW(), NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'health.admin@example.com', 'Health', 'Admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJyqU1Ri', 'organization_admin', '33333333-3333-3333-3333-333333333333', true, NOW(), NOW()),
    
    -- Organization Users
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'tech.user@example.com', 'Tech', 'User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJyqU1Ri', 'organization_user', '11111111-1111-1111-1111-111111111111', true, NOW(), NOW()),
    ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'finance.user@example.com', 'Finance', 'User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJyqU1Ri', 'organization_user', '22222222-2222-2222-2222-222222222222', true, NOW(), NOW()),
    ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'health.user@example.com', 'Health', 'User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJyqU1Ri', 'organization_user', '33333333-3333-3333-3333-333333333333', true, NOW(), NOW());

-- Create Internal Bank Accounts
INSERT INTO internal_organization_bank_accounts (uuid, name, type, account_type, account_number, routing_number, balance, status, created_at, updated_at)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'Main Funding Account', 'funding', 'funding', '1234567890', '021000021', 1000000.00, 'active', NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'Primary Claims Account', 'claims', 'claims', '0987654321', '021000021', 500000.00, 'active', NOW(), NOW()),
    ('66666666-6666-6666-6666-666666666666', 'Secondary Funding Account', 'funding', 'funding', '1122334455', '021000021', 750000.00, 'active', NOW(), NOW()),
    ('77777777-7777-7777-7777-777777777777', 'Reserve Account', 'funding', 'funding', '5544332211', '021000021', 2000000.00, 'active', NOW(), NOW());

-- Create External Bank Accounts
INSERT INTO external_organization_bank_accounts (uuid, name, plaid_account_id, account_type, account_number, routing_number, balance, status, organization_id, created_at, updated_at)
VALUES
    -- Tech Corp Accounts
    ('88888888-8888-8888-8888-888888888888', 'Tech Corp Operating', 'plaid_1', 'checking', '11223344', '021000021', 100000.00, 'active', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
    ('99999999-9999-9999-9999-999999999999', 'Tech Corp Savings', 'plaid_2', 'savings', '44332211', '021000021', 200000.00, 'active', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
    
    -- Finance Ltd Accounts
    ('aaaaaaaa-1111-2222-3333-444444444444', 'Finance Operating', 'plaid_3', 'checking', '55667788', '021000021', 150000.00, 'active', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),
    ('bbbbbbbb-1111-2222-3333-444444444444', 'Finance Savings', 'plaid_4', 'savings', '88776655', '021000021', 300000.00, 'active', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),
    
    -- Health Inc Accounts
    ('cccccccc-1111-2222-3333-444444444444', 'Health Operating', 'plaid_5', 'checking', '99887766', '021000021', 175000.00, 'active', '33333333-3333-3333-3333-333333333333', NOW(), NOW()),
    ('dddddddd-1111-2222-3333-444444444444', 'Health Savings', 'plaid_6', 'savings', '66778899', '021000021', 250000.00, 'active', '33333333-3333-3333-3333-333333333333', NOW(), NOW());

-- Create Sample Payments
INSERT INTO payments (uuid, from_account, to_account, amount, status, description, source_routing_number, destination_routing_number, payment_type, idempotency_key, created_at, updated_at)
VALUES
    -- Tech Corp Payments
    ('eeeeeeee-1111-2222-3333-444444444444', '88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 10000.00, 'completed', 'Tech Corp Funding', '021000021', '021000021', 'ach_debit', 'idempotency_1', NOW(), NOW()),
    ('ffffffff-1111-2222-3333-444444444444', '88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 5000.00, 'pending', 'Tech Corp Claims', '021000021', '021000021', 'ach_debit', 'idempotency_2', NOW(), NOW()),
    
    -- Finance Ltd Payments
    ('gggggggg-1111-2222-3333-444444444444', 'aaaaaaaa-1111-2222-3333-444444444444', '44444444-4444-4444-4444-444444444444', 15000.00, 'completed', 'Finance Ltd Funding', '021000021', '021000021', 'ach_debit', 'idempotency_3', NOW(), NOW()),
    ('hhhhhhhh-1111-2222-3333-444444444444', 'aaaaaaaa-1111-2222-3333-444444444444', '55555555-5555-5555-5555-555555555555', 7500.00, 'processing', 'Finance Ltd Claims', '021000021', '021000021', 'ach_debit', 'idempotency_4', NOW(), NOW()),
    
    -- Health Inc Payments
    ('iiiiiiii-1111-2222-3333-444444444444', 'cccccccc-1111-2222-3333-444444444444', '44444444-4444-4444-4444-444444444444', 20000.00, 'completed', 'Health Inc Funding', '021000021', '021000021', 'ach_debit', 'idempotency_5', NOW(), NOW()),
    ('jjjjjjjj-1111-2222-3333-444444444444', 'cccccccc-1111-2222-3333-444444444444', '55555555-5555-5555-5555-555555555555', 10000.00, 'failed', 'Health Inc Claims', '021000021', '021000021', 'ach_debit', 'idempotency_6', NOW(), NOW()); 