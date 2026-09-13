from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import bcrypt
from jose import jwt, JWTError
from dotenv import load_dotenv
import os

from App.Database.session import SessionLocal
from App.Models.user import User
from App.Schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    ChangePasswordRequest
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================
# ENVIRONMENT VARIABLES
# =========================

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"


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
# REGISTER
# =========================

@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = bcrypt.hashpw(
        request.password.encode("utf-8"),
        bcrypt.gensalt()
    )

    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=hashed_password.decode("utf-8")
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.user_id,
        "name": new_user.name,
        "email": new_user.email
    }


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_valid = bcrypt.checkpw(
        request.password.encode("utf-8"),
        user.password_hash.encode("utf-8")
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    payload = {
        "user_id": user.user_id,
        "email": user.email
    }

    access_token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email
        }
    }


# =========================
# CHANGE PASSWORD
# =========================

@router.put("/change-password")
def change_password(
    request: ChangePasswordRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):

    # =========================
    # CHECK AUTHORIZATION HEADER
    # =========================

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token required"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format"
        )

    token = authorization.replace(
        "Bearer ",
        "",
        1
    )

    # =========================
    # DECODE JWT
    # =========================

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

    # =========================
    # FIND USER
    # =========================

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

    # =========================
    # VERIFY CURRENT PASSWORD
    # =========================

    password_valid = bcrypt.checkpw(
        request.current_password.encode("utf-8"),
        user.password_hash.encode("utf-8")
    )

    if not password_valid:
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # =========================
    # CHECK NEW PASSWORD
    # =========================

    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="New password must contain at least 6 characters"
        )

    # =========================
    # HASH NEW PASSWORD
    # =========================

    new_hashed_password = bcrypt.hashpw(
        request.new_password.encode("utf-8"),
        bcrypt.gensalt()
    )

    # =========================
    # UPDATE PASSWORD
    # =========================

    user.password_hash = (
        new_hashed_password.decode("utf-8")
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }