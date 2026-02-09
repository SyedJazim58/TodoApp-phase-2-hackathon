-- Initial database schema for Task Management API
-- Feature: Backend Core & Data Layer
-- Created: 2026-02-08

-- Create tasks table with user ownership
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient user-scoped queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_id_id ON tasks(user_id, id);

-- Verify table structure
COMMENT ON TABLE tasks IS 'User tasks with strict ownership enforcement';
COMMENT ON COLUMN tasks.user_id IS 'Owner identifier (non-nullable, immutable after creation)';
COMMENT ON COLUMN tasks.title IS 'Task title (required, max 500 characters)';
COMMENT ON COLUMN tasks.description IS 'Optional detailed description';
COMMENT ON COLUMN tasks.completed IS 'Completion status (toggleable)';
COMMENT ON COLUMN tasks.created_at IS 'Creation timestamp (UTC, immutable)';
COMMENT ON COLUMN tasks.updated_at IS 'Last modification timestamp (UTC, auto-updated)';
