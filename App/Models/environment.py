from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from App.Database.base import Base

class Environment(Base):
    __tablename__ = "environments"

    environment_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )