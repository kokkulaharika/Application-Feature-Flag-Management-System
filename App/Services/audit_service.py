from sqlalchemy.orm import Session

from App.Models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    flag_id: int,
    actor: str,
    action: str,
    environment_id: int,
    previous_state: dict | None,
    new_state: dict | None
):
    """
    Create an audit log record for a feature flag change.
    """

    audit_log = AuditLog(
        flag_id=flag_id,
        actor=actor,
        action=action,
        environment_id=environment_id,
        previous_state=previous_state,
        new_state=new_state
    )

    db.add(audit_log)

    return audit_log