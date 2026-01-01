# Database Infrastructure Documentation

## Overview

The Photo Butler application includes a SQLite database infrastructure that is designed to be **optional and non-blocking**. The current version of the application works entirely with localStorage for history records, but the database infrastructure is in place for future features like user authentication and payment processing.

## Key Design Principles

1. **Graceful Degradation**: If the database fails to initialize or becomes unavailable, the application continues to work normally using localStorage.
2. **Non-blocking Initialization**: Database initialization happens asynchronously and does not block the application startup.
3. **Error Resilience**: All database operations include proper error handling and logging.

## Database Structure

### Tables

#### Users Table (Reserved for Future Use)
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Orders Table (Reserved for Future Use)
```sql
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── databaseService.ts      # Main database service
│   ├── utils/
│   │   └── databaseUtils.ts        # Database utility functions
│   ├── types/
│   │   └── database.ts             # Database type definitions
│   └── scripts/
│       └── initDatabase.ts         # Database initialization script
└── data/
    └── photo-butler.db             # SQLite database file
```

## Usage

### Database Service

The `DatabaseService` class provides the main interface for database operations:

```typescript
import { databaseService } from './services/databaseService';

// Check if database is available
if (databaseService.isAvailable()) {
  const connection = databaseService.getConnection();
  // Use the connection for database operations
}
```

### Database Utilities

The `DatabaseUtils` class provides higher-level database operations:

```typescript
import { DatabaseUtils } from './utils/databaseUtils';

// Check database availability
const isAvailable = DatabaseUtils.isAvailable();

// Get health status
const isHealthy = await DatabaseUtils.getHealthStatus();
```

### Manual Database Initialization

You can manually initialize the database using the npm script:

```bash
npm run db:init
```

## Health Monitoring

The application includes database health monitoring through the `/health` endpoint:

```bash
curl http://localhost:3001/health
```

Response includes database status:
```json
{
  "status": "ok",
  "message": "Photo Butler API is running",
  "database": {
    "available": true,
    "healthy": true
  }
}
```

## Error Handling

The database infrastructure includes comprehensive error handling:

1. **Connection Errors**: If the database cannot be opened, the service logs the error and continues without database functionality.
2. **Query Errors**: Individual database operations handle errors gracefully and return appropriate fallback values.
3. **Health Check Failures**: The health check endpoint reports database status without affecting application functionality.

## Testing

Database functionality is tested with unit tests that cover:

- Successful database initialization
- Table creation
- Graceful failure handling
- Health checks
- Connection management

Run database tests:
```bash
npm test -- --testPathPatterns=databaseService.test.ts
```

## Future Enhancements

The database infrastructure is prepared for future features:

1. **User Authentication**: User registration, login, and session management
2. **Payment Processing**: Order tracking and payment history
3. **Advanced History**: Server-side history storage with user accounts
4. **Analytics**: Usage tracking and reporting

## Configuration

Database configuration is handled automatically:

- **Database Path**: `backend/data/photo-butler.db`
- **Connection Timeout**: 30 seconds
- **Auto-create Tables**: Yes
- **Error Logging**: Console and future log files

## Maintenance

### Backup

To backup the database:
```bash
cp backend/data/photo-butler.db backup/photo-butler-$(date +%Y%m%d).db
```

### Reset Database

To reset the database:
```bash
rm backend/data/photo-butler.db
npm run db:init
```

### Database Size Monitoring

The SQLite database file size can be monitored. For production use, consider implementing:
- Regular VACUUM operations
- Database size limits
- Automatic cleanup of old records