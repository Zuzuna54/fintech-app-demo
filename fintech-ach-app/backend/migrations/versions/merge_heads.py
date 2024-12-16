"""merge heads

Revision ID: merge_heads
Revises: a609893a00df, add_test_user_rev
Create Date: 2024-03-16 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_heads_rev'
down_revision = ('a609893a00df', 'add_test_user_rev')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass 