from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
import os

from App.Database.session import SessionLocal
from App.Models.user import User
from App.Schemas.notification_schema import (
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# =========================
# ENVIRONMENT VARIABLES
# =========================

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"


# =========================
# HTTP BEARER
# =========================

security = HTTPBearer()


# =========================
# DATABASE DEPENDENCY
# =========================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================
# GET CURRENT USER
# =========================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# =========================
# GET NOTIFICATION PREFERENCES
# =========================

@router.get(
    "/preferences",
    response_model=NotificationPreferencesResponse
)
def get_notification_preferences(
    current_user: User = Depends(get_current_user)
):

    return {
        "flag_changes": current_user.flag_changes_notifications,
        "audit_activity": current_user.audit_activity_notifications
    }


# =========================
# UPDATE NOTIFICATION PREFERENCES
# =========================

@router.put(
    "/preferences",
    response_model=NotificationPreferencesResponse
)
def update_notification_preferences(
    request: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    current_user.flag_changes_notifications = request.flag_changes

    current_user.audit_activity_notifications = request.audit_activity

    db.commit()
    db.refresh(current_user)

    return {
        "flag_changes": current_user.flag_changes_notifications,
        "audit_activity": current_user.audit_activity_notifications
    }