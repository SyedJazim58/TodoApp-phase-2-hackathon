---
name: auth-skill
description: Implement secure authentication flows including signup, signin, password hashing, JWT tokens, and Better Auth integration.
---

# Authentication Skill

## Instructions

1. **User Signup**
   - Validate user input (email, password)
   - Hash passwords before storage
   - Prevent duplicate accounts

2. **User Signin**
   - Verify credentials securely
   - Issue JWT access tokens
   - Handle invalid login attempts gracefully

3. **Password Security**
   - Use strong hashing (bcrypt/argon2)
   - Never store plaintext passwords
   - Support password updates securely

4. **Token Management**
   - Generate JWT tokens with expiry
   - Verify tokens on protected routes
   - Support token refresh where applicable

5. **Better Auth Integration**
   - Follow Better Auth conventions
   - Use provided middleware/hooks
   - Keep auth logic modular and reusable

## Best Practices

- Follow OWASP authentication guidelines
- Use environment variables for secrets
- Keep auth logic isolated from business logic
- Return clear but non-sensitive error messages

## Example Structure

```python
def signup(user_input):
    hashed_password = hash_password(user_input.password)
    save_user(user_input.email, hashed_password)

def signin(credentials):
    verify_password(credentials)
    return generate_jwt(credentials.user_id)
