"""add test user

Revision ID: add_test_user
Revises: 637f6c8957ec
Create Date: 2024-03-16 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_test_user_rev'
down_revision = '637f6c8957ec'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add test superuser with password "password123"
    op.execute("""
        INSERT INTO superusers (id, email, hashed_password, first_name, last_name, role, created_at, updated_at)
        VALUES (
            '1a6cc45f-ac55-4af0-9fd1-27058524223a',
            'test.admin@example.com',
            '$2b$12$tkN4mxqCKsmZ.DLy0L7IW.hn55mmIoAtpABwREVHongrldaNvldGS',
            'Test',
            'Admin',
            'SUPERUSER',
            NOW(),
            NOW()
        );
    """)

def downgrade() -> None:
    op.execute("""
        DELETE FROM superusers
        WHERE email = 'test.admin@example.com';
    """) 