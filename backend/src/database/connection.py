"""
Database connection management for Neon Serverless PostgreSQL.

This module configures the database engine with connection pooling optimized
for serverless PostgreSQL, including cold start handling and connection limits.
"""

from sqlmodel import create_engine, Session
from typing import Generator
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
        "Please configure it in .env file."
    )

# Create engine with connection pooling for serverless PostgreSQL
# - pool_size=5: Small pool respects Neon's connection limits
# - max_overflow=10: Burst capacity for concurrent requests
# - pool_pre_ping=True: Validates connections before use (handles cold starts)
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=False  # Set to True for SQL query logging during development
)


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides database session.

    Yields a database session that automatically commits on success
    and rolls back on error. Session is closed after use.

    Yields:
        Session: SQLModel database session

    Usage:
        @app.get("/tasks")
        def get_tasks(session: Session = Depends(get_session)):
            # Use session for database operations
            pass
    """
    with Session(engine) as session:
        yield session
