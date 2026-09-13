from pydantic import BaseModel


class NotificationPreferencesResponse(BaseModel):
    flag_changes: bool
    audit_activity: bool


class NotificationPreferencesUpdate(BaseModel):
    flag_changes: bool
    audit_activity: bool