---
name: database-skill
description: Design database schemas, create tables, and manage migrations using best practices.
---

# Database Skill

## Instructions

1. **Schema Design**
   - Identify core entities and relationships
   - Define primary keys and foreign keys
   - Normalize data where appropriate

2. **Table Creation**
   - Create tables with clear column definitions
   - Use appropriate data types and constraints
   - Enforce uniqueness and referential integrity

3. **Migrations**
   - Generate versioned migration files
   - Support forward and rollback migrations
   - Keep migrations atomic and reversible

4. **Schema Evolution**
   - Modify schemas without data loss
   - Handle nullable vs non-nullable changes safely
   - Maintain backward compatibility when possible

## Best Practices

- Keep schema simple and explicit
- Use migrations for all schema changes
- Avoid breaking changes without a migration plan
- Document schema decisions clearly

## Example Structure

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
