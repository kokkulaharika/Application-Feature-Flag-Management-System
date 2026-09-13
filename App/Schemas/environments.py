from pydantic import BaseModel

# Schema used when creating an environment.
class EnvironmentCreate(BaseModel):
    name: str
    description: str

# Schema used when updating an existing environment.
class EnvironmentUpdate(BaseModel):
    name: str
    description: str