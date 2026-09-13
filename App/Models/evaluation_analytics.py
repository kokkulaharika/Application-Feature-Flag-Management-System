from sqlalchemy import Column, Integer, Date, ForeignKey

from App.Database.base import Base


class EvaluationAnalytics(Base):
    __tablename__ = "evaluation_analytics"

    evaluation_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Keep historical analytics after flag deletion.
    # The flag_id becomes NULL when the flag is deleted.
    flag_id = Column(
        Integer,
        ForeignKey(
            "flags.flag_id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    evaluation_date = Column(
        Date,
        nullable=False
    )

    evaluation_hour = Column(
        Integer,
        nullable=False
    )

    evaluation_count = Column(
        Integer,
        nullable=False,
        default=0
    )