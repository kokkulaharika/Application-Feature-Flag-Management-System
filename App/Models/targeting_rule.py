from sqlalchemy import Column, Integer, String, ForeignKey

from App.Database.base import Base


class TargetingRule(Base):
    __tablename__ = "targeting_rules"

    rule_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    flag_id = Column(
        Integer,
        ForeignKey(
            "flags.flag_id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    attribute = Column(
        String(100),
        nullable=False
    )

    operator = Column(
        String(50),
        nullable=False
    )

    value = Column(
        String(255),
        nullable=False
    )