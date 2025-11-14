# Railway Database Setup Guide

## Current Setup (Local Development)

Your application is currently configured to use **SQLite** for local development:
- Database file: `deepfake.db` (in the backend directory)
- No setup required - works automatically
- All tables are created automatically on first run

## Setting Up PostgreSQL Database on Railway

### Step 1: Create PostgreSQL Service on Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL database
   - Generate connection credentials
   - Set up the database

### Step 2: Get Database Connection String

1. Click on your PostgreSQL service in Railway
2. Go to the **"Variables"** tab
3. Find the `DATABASE_URL` variable
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:password@hostname:5432/railway
   ```

### Step 3: Update Backend Environment Variables

In your **Backend Service** on Railway:

1. Go to **"Variables"** tab
2. Add/Update these variables:

   ```
   DATABASE_URL=<paste-the-connection-string-from-step-2>
   SECRET_KEY=<your-secret-key>
   USE_CELERY=false
   ```

   **Important**: 
   - The `DATABASE_URL` from PostgreSQL service is automatically available
   - You can reference it as `${{Postgres.DATABASE_URL}}` or copy the full string
   - Make sure to set `SECRET_KEY` to a strong random value

### Step 4: Database Tables Auto-Creation

The application will automatically create all tables on first startup:

- `users` - User accounts and authentication
- `jobs` - Image analysis jobs
- `model_results` - Analysis results from models

**No manual migration needed!** The code handles this automatically:
```python
Base.metadata.create_all(bind=engine)
```

### Step 5: Verify Database Connection

After deployment, check the logs to ensure:
- Database connection successful
- Tables created successfully
- No connection errors

## Database Schema

### Users Table
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

### Jobs Table
```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY,
    image_id VARCHAR UNIQUE NOT NULL,
    file_path VARCHAR,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id)
);
```

### Model Results Table
```sql
CREATE TABLE model_results (
    id INTEGER PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    model_name VARCHAR,
    confidence_real FLOAT,
    confidence_fake FLOAT,
    label VARCHAR,
    heatmap_path VARCHAR
);
```

## Switching from SQLite to PostgreSQL

The application automatically detects the database type:

- **Local Development**: Uses SQLite (`sqlite:///./deepfake.db`)
- **Railway/Production**: Uses PostgreSQL (from `DATABASE_URL` environment variable)

**No code changes needed!** Just set the `DATABASE_URL` environment variable.

## Testing Database Connection

### From Railway Logs
Check your backend service logs for:
```
INFO: Application startup complete.
```
(No database errors)

### From API
Test the registration endpoint:
```bash
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```

If successful, the user is stored in PostgreSQL!

## Troubleshooting

### Issue: "Database connection failed"
- Check `DATABASE_URL` is set correctly
- Verify PostgreSQL service is running
- Check network connectivity

### Issue: "Table already exists"
- This is normal if tables were already created
- The app will continue working

### Issue: "No such table: users"
- Restart the backend service
- Tables should be created automatically

## Local vs Railway Database

| Feature | Local (SQLite) | Railway (PostgreSQL) |
|---------|---------------|---------------------|
| Database File | `deepfake.db` | Managed by Railway |
| Setup | Automatic | Add PostgreSQL service |
| Connection | File-based | Network connection |
| Scalability | Single user | Multi-user production |
| Backup | Manual file copy | Railway handles backups |

## Important Notes

1. **Local Development**: Keep using SQLite for local testing
2. **Railway Production**: Use PostgreSQL for production
3. **Data Migration**: If you have local data, you'll need to export/import manually
4. **Environment Variables**: Always set `DATABASE_URL` on Railway
5. **Secret Key**: Generate a strong random key for production

## Generating Secret Key

Run this command to generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Use this value for `SECRET_KEY` environment variable on Railway.

