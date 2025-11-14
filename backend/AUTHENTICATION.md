# Authentication System

## Overview

The application now includes a complete authentication system with:
- User registration (sign up)
- User login
- JWT token-based authentication
- Password hashing with bcrypt
- Protected API endpoints

## User Data Storage

### Database Schema

User credentials are stored in the `users` table with the following structure:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt before storage
   - Never stored in plain text
   - Uses industry-standard bcrypt algorithm
   - Salt is automatically generated

2. **JWT Tokens**: Authentication uses JSON Web Tokens
   - Tokens expire after 30 days
   - Stored in browser localStorage
   - Sent with every API request as Bearer token

3. **Protected Endpoints**: The following endpoints require authentication:
   - `POST /upload` - Upload images
   - `GET /dashboard` - Get user's jobs
   - `GET /jobs/{id}` - Get job details

## API Endpoints

### Register New User
```
POST /api/auth/register
Body: {
  "username": "string",
  "email": "string",
  "password": "string"
}
Response: User object
```

### Login
```
POST /api/auth/login
Body: {
  "username": "string",
  "password": "string"
}
Response: {
  "access_token": "string",
  "token_type": "bearer",
  "user": User object
}
```

### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: User object
```

## Frontend Pages

- `/login` - Login page
- `/register` - Registration page

## Environment Variables

For production (Railway), set:
- `SECRET_KEY` - A strong random secret key for JWT signing
- `DATABASE_URL` - Your PostgreSQL connection string

## Security Notes

1. **Change SECRET_KEY**: The default secret key in `auth.py` should be changed in production
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for enhanced security)
4. **Password Requirements**: Currently minimum 6 characters (can be enhanced)

## User-Job Relationship

Each job is now linked to a user via `user_id` foreign key:
- Users can only see their own jobs
- Dashboard shows only the logged-in user's jobs
- Uploads are automatically associated with the current user

