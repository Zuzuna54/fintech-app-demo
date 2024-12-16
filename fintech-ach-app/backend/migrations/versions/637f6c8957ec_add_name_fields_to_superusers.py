"""add_name_fields_to_superusers

Revision ID: 637f6c8957ec
Revises: 8f02d9f6c53a
Create Date: 2024-12-16 17:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '637f6c8957ec'
down_revision = '8f02d9f6c53a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add first_name and last_name columns to superusers table
    op.add_column('superusers', sa.Column('first_name', sa.String(), nullable=True))
    op.add_column('superusers', sa.Column('last_name', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove first_name and last_name columns from superusers table
    op.drop_column('superusers', 'last_name')
    op.drop_column('superusers', 'first_name')
