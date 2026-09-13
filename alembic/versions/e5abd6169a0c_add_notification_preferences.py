"""add notification preferences

Revision ID: e5abd6169a0c
Revises: 56bd5458e354
Create Date: 2026-08-28 23:12:45.763394

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5abd6169a0c'
down_revision: Union[str, Sequence[str], None] = '56bd5458e354'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        'users',
        sa.Column(
            'flag_changes_notifications',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true()
        )
    )

    op.add_column(
        'users',
        sa.Column(
            'audit_activity_notifications',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true()
        )
    )


def downgrade():
    op.drop_column('users', 'audit_activity_notifications')
    op.drop_column('users', 'flag_changes_notifications')
