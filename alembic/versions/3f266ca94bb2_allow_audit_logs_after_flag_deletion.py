"""allow audit logs after flag deletion

Revision ID: 3f266ca94bb2
Revises: fc4cf35edb94
Create Date: 2026-08-29 23:19:28.196874

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f266ca94bb2'
down_revision: Union[str, Sequence[str], None] = 'fc4cf35edb94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.alter_column(
        'audit_logs',
        'flag_id',
        existing_type=sa.INTEGER(),
        nullable=True
    )

    op.drop_constraint(
        'audit_logs_flag_id_fkey',
        'audit_logs',
        type_='foreignkey'
    )

    op.create_foreign_key(
        'audit_logs_flag_id_fkey',
        'audit_logs',
        'flags',
        ['flag_id'],
        ['flag_id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        'audit_logs_flag_id_fkey',
        'audit_logs',
        type_='foreignkey'
    )

    op.create_foreign_key(
        'audit_logs_flag_id_fkey',
        'audit_logs',
        'flags',
        ['flag_id'],
        ['flag_id']
    )

    op.alter_column(
        'audit_logs',
        'flag_id',
        existing_type=sa.INTEGER(),
        nullable=False
    )
