---
name: backend-skill
description: Generate backend routes, handle requests and responses, and connect application logic to the database.
---

# Backend Skill

## Instructions

1. **Route Generation**
   - Define RESTful routes for core resources
   - Use clear and consistent URL patterns
   - Separate public and protected endpoints

2. **Request Handling**
   - Validate incoming request data
   - Parse parameters, query strings, and bodies
   - Handle errors with appropriate status codes

3. **Response Handling**
   - Return structured, predictable responses
   - Use proper HTTP status codes
   - Avoid leaking internal errors or stack traces

4. **Database Integration**
   - Connect routes to database operations
   - Use ORM/SQLModel for queries
   - Manage database sessions cleanly

## Best Practices

- Keep routing, logic, and data layers separate
- Use dependency injection where possible
- Write idempotent and predictable endpoints
- Log errors without exposing sensitive data

## Example Structure

```python
@router.post("/tasks")
def create_task(task: TaskCreate, session: Session):
    db_task = save_task(task, session)
    return {"id": db_task.id}
