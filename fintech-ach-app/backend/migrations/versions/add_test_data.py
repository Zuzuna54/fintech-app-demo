"""add comprehensive test data

Revision ID: add_test_data_rev
Revises: merge_heads_rev
Create Date: 2024-03-16 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timedelta
import random
import bcrypt

# revision identifiers, used by Alembic.
revision = 'add_test_data_rev'
down_revision = 'merge_heads_rev'
branch_labels = None
depends_on = None

def generate_uuid():
    return str(uuid.uuid4())

def generate_account_number():
    return ''.join([str(random.randint(0, 9)) for _ in range(10)])

def generate_routing_number():
    return ''.join([str(random.randint(0, 9)) for _ in range(9)])

def upgrade() -> None:
    conn = op.get_bind()
    
    # Create organizations
    organizations = []
    for i in range(1, 11):
        org_id = generate_uuid()
        organizations.append({
            'id': org_id,
            'name': f'Test Organization {i}',
            'description': f'Description for test organization {i}',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })

    for org in organizations:
        conn.execute(text("""
            INSERT INTO organizations (id, name, description, status, created_at, updated_at)
            VALUES (:id, :name, :description, :status, :created_at, :updated_at)
        """), org)

    # Create organization admins
    password_hash = bcrypt.hashpw('password123'.encode(), bcrypt.gensalt()).decode()
    for i in range(5):
        org = organizations[i]
        conn.execute(text("""
            INSERT INTO organization_administrators (
                id, email, hashed_password, first_name, last_name,
                role, organization_id, created_at, updated_at
            )
            VALUES (
                :id, :email, :password, :first_name, :last_name,
                :role, :org_id, NOW(), NOW()
            )
        """), {
            'id': generate_uuid(),
            'email': f'admin{i+1}@example.com',
            'password': password_hash,
            'first_name': 'Admin',
            'last_name': f'User {i+1}',
            'role': 'ORGANIZATION_ADMIN',
            'org_id': org['id']
        })

    # Create internal accounts
    for i in range(25):
        org = organizations[i % len(organizations)]
        account_type = 'FUNDING' if i % 2 == 0 else 'CLAIMS'
        conn.execute(text("""
            INSERT INTO internal_organization_bank_accounts (
                uuid, name, type, account_type, account_number,
                routing_number, balance, status, created_at, updated_at
            )
            VALUES (
                :uuid, :name, :type, :account_type, :account_number,
                :routing_number, :balance, :status, NOW(), NOW()
            )
        """), {
            'uuid': generate_uuid(),
            'name': f'Internal Account {i+1}',
            'type': account_type,
            'account_type': account_type,
            'account_number': generate_account_number(),
            'routing_number': generate_routing_number(),
            'balance': random.uniform(10000, 1000000),
            'status': 'ACTIVE'
        })

    # Create external accounts
    for i in range(25):
        org = organizations[i % len(organizations)]
        account_type = 'CHECKING' if i % 2 == 0 else 'SAVINGS'
        conn.execute(text("""
            INSERT INTO external_organization_bank_accounts (
                uuid, name, plaid_account_id, account_type,
                account_number, routing_number, balance, status,
                organization_id, created_at, updated_at
            )
            VALUES (
                :uuid, :name, :plaid_account_id, :account_type,
                :account_number, :routing_number, :balance, :status,
                :organization_id, NOW(), NOW()
            )
        """), {
            'uuid': generate_uuid(),
            'name': f'External Account {i+1}',
            'plaid_account_id': f'plaid_acc_{generate_uuid()}',
            'account_type': account_type,
            'account_number': generate_account_number(),
            'routing_number': generate_routing_number(),
            'balance': random.uniform(5000, 500000),
            'status': 'ACTIVE',
            'organization_id': org['id']
        })

    # Get account IDs for payments
    internal_accounts = [row[0] for row in conn.execute(text("""
        SELECT uuid FROM internal_organization_bank_accounts;
    """)).fetchall()]

    external_accounts = [row[0] for row in conn.execute(text("""
        SELECT uuid FROM external_organization_bank_accounts;
    """)).fetchall()]

    # Create payments
    payment_statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
    payment_types = ['ach_debit', 'ach_credit']
    
    for i in range(50):
        # Randomly select accounts and ensure they're different
        from_account = random.choice(internal_accounts + external_accounts)
        to_accounts = [acc for acc in internal_accounts + external_accounts if acc != from_account]
        to_account = random.choice(to_accounts)
        
        status = random.choice(payment_statuses)
        payment_type = random.choice(payment_types)
        
        # Create payment with random amount and routing numbers
        conn.execute(text("""
            INSERT INTO payments (
                uuid, from_account, to_account, amount, status,
                description, source_routing_number, destination_routing_number,
                payment_type, idempotency_key, created_at, updated_at
            )
            VALUES (
                :uuid, :from_account, :to_account, :amount, :status,
                :description, :source_routing_number, :destination_routing_number,
                :payment_type, :idempotency_key,
                NOW() - :created_days * interval '1 day',
                NOW() - :updated_days * interval '1 day'
            )
        """), {
            'uuid': generate_uuid(),
            'from_account': from_account,
            'to_account': to_account,
            'amount': random.uniform(100, 50000),
            'status': status,
            'description': f'Test payment {i+1}',
            'source_routing_number': generate_routing_number(),
            'destination_routing_number': generate_routing_number(),
            'payment_type': payment_type,
            'idempotency_key': generate_uuid(),
            'created_days': random.randint(1, 30),
            'updated_days': random.randint(0, 29)
        })

def downgrade() -> None:
    # Delete all seed data in reverse order
    conn = op.get_bind()
    conn.execute(text("DELETE FROM payments;"))
    conn.execute(text("DELETE FROM external_organization_bank_accounts;"))
    conn.execute(text("DELETE FROM internal_organization_bank_accounts;"))
    conn.execute(text("DELETE FROM organization_administrators;"))
    conn.execute(text("DELETE FROM organizations WHERE name LIKE 'Test Organization%';"))