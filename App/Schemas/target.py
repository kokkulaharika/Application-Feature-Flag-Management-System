from pydantic import BaseModel


# Schema used when creating a targeting rule.
class TargetingRuleCreate(BaseModel):
    flag_id: int
    attribute: str
    operator: str
    value: str

# Schema used when updating an existing targeting rule.
class TargetingRuleUpdate(BaseModel):
    flag_id: int
    attribute: str
    operator: str
    value: str