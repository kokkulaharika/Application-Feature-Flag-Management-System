from pydantic import BaseModel


# Schema used when creating a new feature flag.
class FlagCreate(BaseModel):
    environment_id: int
    key: str
    type: str
    default_value: str | None = None
    enabled: bool = False
    description: str | None = None
    owner_team: str | None = None


# Schema used when updating an existing feature flag.
class FlagUpdate(BaseModel):
    key: str | None = None
    type: str | None = None
    default_value: str | None = None
    enabled: bool | None = None
    description: str | None = None
    owner_team: str | None = None