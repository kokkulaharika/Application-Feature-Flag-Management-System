"""add flag cleanup tracking fields

Revision ID: 30e06eb50c8d
Revises: 6e6144540e54
Create Date: 2026-08-29 22:12:00.835867

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "30e06eb50c8d"

down_revision: Union[str, Sequence[str], None] = "6e6144540e54"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "flags",
        sa.Column(
            "cleanup_state",
            sa.String(length=30),
            nullable=True
        )
    )

    op.add_column(
        "flags",
        sa.Column(
            "cleanup_state_since",
            sa.DateTime(timezone=True),
            nullable=True
        )
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "flags",
        "cleanup_state_since"
    )

    op.drop_column(
        "flags",
        "cleanup_state"
    )