import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from App.Database.base import Base
from App.Database.session import engine

# Import models so SQLAlchemy knows about the tables
from App.Models.user import User
from App.Models.evaluation_analytics import EvaluationAnalytics

from App.Services.evaluation_analytics_flush_service import (
    flush_evaluation_analytics
)

from App.api.flag_routes import router
from App.api.audit_routes import router as audit_router
from App.api.auth_routes import router as auth_router
from App.api.notification_routes import router as notification_router


# =========================
# DAILY ANALYTICS FLUSH
# =========================

async def daily_analytics_flush():
    """
    Run evaluation analytics flush once every 24 hours.
    """

    while True:

        # Wait for 24 hours
        await asyncio.sleep(60 * 60 * 24)

        try:
            flush_evaluation_analytics()

            print(
                "Daily evaluation analytics flush completed"
            )

        except Exception as e:

            print(
                f"Daily evaluation analytics flush failed: {e}"
            )


# =========================
# APPLICATION LIFESPAN
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Start background analytics flush task
    task = asyncio.create_task(
        daily_analytics_flush()
    )

    yield

    # Stop background task when application shuts down
    task.cancel()


# =========================
# CREATE FASTAPI APPLICATION
# =========================

app = FastAPI(
    title="Feature Flag Management System",
    version="1.0.0",
    lifespan=lifespan
)


# =========================
# CREATE DATABASE TABLES
# =========================

Base.metadata.create_all(
    bind=engine
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,

    # React frontend
    allow_origins=[
    "http://localhost:3000",
    "https://feature-flag-management.netlify.app"
],

    # Allow credentials such as authentication tokens
    allow_credentials=True,

    # Allow GET, POST, PUT, DELETE, etc.
    allow_methods=["*"],

    # Allow request headers
    allow_headers=["*"],
)


# =========================
# HOME
# =========================

@app.get("/")
def home():

    with engine.connect() as connection:
        connection.execute(
            text("SELECT 1")
        )

    return {
        "message": "Connected Successfully"
    }


# =========================
# ROUTES
# =========================

# Feature flag routes
app.include_router(router)

# Audit log routes
app.include_router(audit_router)

# Authentication routes
app.include_router(auth_router)
app.include_router(notification_router)