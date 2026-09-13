from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func

from App.Database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Keep audit history even after a feature flag is deleted.
    # When the flag is deleted, this value becomes NULL.
    flag_id = Column(
        Integer,
        ForeignKey(
            "flags.flag_id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    actor = Column(
        String(100),
        nullable=False
    )

    action = Column(
        String(50),
        nullable=False
    )

    environment_id = Column(
        Integer,
        ForeignKey("environments.environment_id"),
        nullable=False
    )

    previous_state = Column(JSON)

    new_state = Column(JSON)

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )