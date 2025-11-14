# Local Development Setup

## Current Database: SQLite

Your application is configured to use **SQLite** for local development. This means:

✅ **No database setup required**  
✅ **Works immediately**  
✅ **All data stored in `deepfake.db` file**  
✅ **Perfect for local testing**

## How It Works

1. **Database File**: `deepfake.db` (created automatically in backend directory)
2. **Auto-Creation**: Tables are created automatically on first run
3. **No Configuration**: Works out of the box

## Starting the Backend

```bash
cd deepfake-backend/backend
source venv/bin/activate
export USE_CELERY=false
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The database will be created automatically with these tables:
- `users` - For authentication
- `jobs` - For image analysis jobs
- `model_results` - For analysis results

## Testing Authentication Locally

### 1. Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### 3. View Database
```bash
sqlite3 deepfake.db
.tables
SELECT * FROM users;
```

## Database Location

- **File**: `deepfake-backend/backend/deepfake.db`
- **Backup**: Just copy this file
- **Reset**: Delete the file and restart (tables recreate automatically)

## Switching to Railway PostgreSQL

When ready for Railway:

1. **No code changes needed!**
2. Just set `DATABASE_URL` environment variable on Railway
3. The app automatically uses PostgreSQL instead of SQLite
4. See `RAILWAY_DATABASE_SETUP.md` for detailed instructions

## Current Status

✅ Local SQLite database working  
✅ Authentication system ready  
✅ Tables auto-created  
✅ Ready for local testing  
📋 Ready to deploy to Railway when needed

