from fastapi import APIRouter
from App.Database.session import SessionLocal
from App.Models.audit_log import AuditLog


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


# GET /audit-logs
# Returns all audit log records.
@router.get("")
def get_audit_logs():

    # Create a database session.
    db = SessionLocal()

    try:
        # Get all audit logs, newest first.
        audit_logs = db.query(AuditLog).order_by(
            AuditLog.audit_id.desc()
        ).all()

        return audit_logs

    finally:
        # Always close the database session.
        db.close()