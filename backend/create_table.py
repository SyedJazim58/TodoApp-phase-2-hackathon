"""
Script to create the tasks table in Neon PostgreSQL database.
Run this once to initialize the database schema.
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_tasks_table():
    """Create tasks table with indexes in the database."""

    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ ERROR: DATABASE_URL not found in .env file")
        return False

    # SQL schema from 001_initial_schema.sql
    create_table_sql = """
    -- Create tasks table with user ownership
    CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for efficient user-scoped queries
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id_id ON tasks(user_id, id);

    -- Add comments
    COMMENT ON TABLE tasks IS 'User tasks with strict ownership enforcement';
    COMMENT ON COLUMN tasks.user_id IS 'Owner identifier (non-nullable, immutable after creation)';
    COMMENT ON COLUMN tasks.title IS 'Task title (required, max 500 characters)';
    COMMENT ON COLUMN tasks.description IS 'Optional detailed description';
    COMMENT ON COLUMN tasks.completed IS 'Completion status (toggleable)';
    COMMENT ON COLUMN tasks.created_at IS 'Creation timestamp (UTC, immutable)';
    COMMENT ON COLUMN tasks.updated_at IS 'Last modification timestamp (UTC, auto-updated)';
    """

    try:
        print("📡 Connecting to Neon PostgreSQL database...")

        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        print("✅ Connected successfully!")
        print("🔨 Creating tasks table...")

        # Execute SQL
        cursor.execute(create_table_sql)
        conn.commit()

        print("✅ Tasks table created successfully!")

        # Verify table creation
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'tasks'
        """)

        result = cursor.fetchone()
        if result:
            print(f"✅ Verified: Table '{result[0]}' exists in database")

            # Get column information
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'tasks'
                ORDER BY ordinal_position
            """)

            columns = cursor.fetchall()
            print("\n📋 Table Structure:")
            print("-" * 60)
            for col_name, col_type, nullable in columns:
                null_str = "NULL" if nullable == "YES" else "NOT NULL"
                print(f"  {col_name:20} {col_type:20} {null_str}")
            print("-" * 60)

            # Get indexes
            cursor.execute("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'tasks'
            """)

            indexes = cursor.fetchall()
            print("\n🔍 Indexes:")
            for idx in indexes:
                print(f"  - {idx[0]}")

        cursor.close()
        conn.close()

        print("\n🎉 Database setup complete!")
        return True

    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        print(f"   Error code: {e.pgcode}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("  Task Management API - Database Setup")
    print("=" * 60)
    print()

    success = create_tasks_table()

    if success:
        print("\n✅ You can now start the FastAPI server!")
        print("   Run: uvicorn src.main:app --reload")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")
