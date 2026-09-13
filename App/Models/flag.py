from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.sql import func

from App.Database.base import Base


class Flag(Base):
    __tablename__ = "flags"
    
    __table_args__ = (
        UniqueConstraint(
            "key",
            "environment_id",
            name="uq_flag_key_environment"
        ),
    )

    flag_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    environment_id = Column(
        Integer,
        ForeignKey("environments.environment_id"),
        nullable=False,
        index=True
    )

    key = Column(
        String(100),
        nullable=False,
        index=True
    )

    type = Column(
        String(20),
        nullable=False
    )

    default_value = Column(
        String(100)
    )

    enabled = Column(
        Boolean,
        default=False
    )

    description = Column(
        Text
    )

    owner_team = Column(
        String(100)
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # ==========================================
    # FLAG CLEANUP TRACKING
    # ==========================================

    cleanup_state = Column(
        String(30),
        nullable=True
    )

    cleanup_state_since = Column(
        DateTime(timezone=True),
        nullable=True
    )