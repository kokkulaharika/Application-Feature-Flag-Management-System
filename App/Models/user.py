from sqlalchemy import Column, Integer, String, Boolean

from App.Database.base import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String,
        nullable=False
    )

    # Notification preferences
    flag_changes_notifications = Column(
        Boolean,
        nullable=False,
        default=True
    )

    audit_activity_notifications = Column(
        Boolean,
        nullable=False,
        default=True
    )