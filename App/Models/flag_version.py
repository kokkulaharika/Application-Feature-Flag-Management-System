from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from App.Database.base import Base


class FlagVersion(Base):
    __tablename__ = "flag_versions"

    version_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Keep version history even after the feature flag is deleted.
    # When the flag is deleted, flag_id will automatically become NULL.
    flag_id = Column(
        Integer,
        ForeignKey(
            "flags.flag_id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    version_number = Column(
        Integer,
        nullable=False
    )

    old_value = Column(
        String(100)
    )

    new_value = Column(
        String(100)
    )

    changed_by = Column(
        String(100),
        nullable=False
    )

    changed_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )