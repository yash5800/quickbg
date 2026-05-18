# Database Design

## Overview

The project uses **MongoDB** as its primary database for job management and queue processing.

## Database Name

```
testbgremover
```

## Collections

### jobs Collection

The main collection storing all image processing jobs.

#### Schema (Optimized - Removed Redundancies)

```javascript
{
  _id: ObjectId,           // MongoDB unique identifier
  jobId: string,          // Unique job identifier (UUID)
  status: string,        // Job status: "queued" | "running" | "completed" | "failed"
  createdAt: Date,        // Job creation timestamp
  updatedAt: Date,        // Last update timestamp
  expiresAt: Date,        // TTL auto-deletion timestamp (10 minutes from creation)
  fileName: string,      // Original uploaded filename
  sessionId: string,     // User session identifier
  resultPath?: string,   // Path to processed result file (optional)
  error?: string,        // Error message if failed (optional)
}
```

**Optimizations Made:**
- ❌ Removed `progress` - Derived from `status` field
- ❌ Removed `completedAt` - Use `status === "completed"` instead
- ❌ Removed `queuePosition` & `estimatedWait` - Computed on-demand
- ✅ Added `updatedAt` - Track all modifications
- ✅ Added `expiresAt` with TTL index - Auto-deletion without manual cleanup

#### Indexes

```javascript
// Unique index on jobId
{ jobId: 1 }

// Composite index for session-based queries
{ sessionId: 1, createdAt: -1 }

// TTL index for automatic deletion (10 minutes)
{ expiresAt: 1 } with expireAfterSeconds=0
```

#### Example Document

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  jobId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  status: "completed",
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:45Z"),
  expiresAt: ISODate("2024-01-15T10:40:00Z"),  // Auto-deleted after 10 minutes
  fileName: "photo.jpg",
  sessionId: "user-session-123",
  resultPath: "./uploads/processed/a1b2c3d4.png"
}
```

## Data Flow

### Job Lifecycle

```
created ──▶ queued ──▶ running ──▶ completed
                    │           │
                    │           └──▶ failed (error)
                    │
                    └──▶ cancelled
```

Auto-deleted after `expiresAt` timestamp via MongoDB TTL index.

### Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job waiting in queue |
| `running` | Currently being processed |
| `completed` | Successfully processed |
| `failed` | Processing failed |

### Progress Derivation

Instead of storing `progress` field:
- `status: "queued"` → progress = 0%
- `status: "running"` → progress = 50%
- `status: "completed"` → progress = 100%
- `status: "failed"` → progress = 0% (with error message)

## Queries

### Common Operations

#### Get jobs by session
```javascript
db.jobs.find({ sessionId: "user-session-123" }).sort({ createdAt: -1 })
```

#### Get job status
```javascript
db.jobs.findOne({ jobId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
```

#### Session statistics
```javascript
db.jobs.aggregate([
  { $match: { sessionId: "user-session-123" } },
  { $group: {
    _id: "$status",
    count: { $sum: 1 }
  }}
])
```

## Data Retention

- **TTL Strategy**: MongoDB automatically deletes documents when `expiresAt` timestamp is reached
- **Retention Period**: 10 minutes (configured via `WORKER_JOB_RETENTION_MINUTES=10`)
- **Worker Cleanup**: Worker cleanup loop also deletes image files from disk when jobs expire
- **No Manual Cleanup Needed**: TTL index handles database cleanup, worker handles file cleanup

## Environment Variables

### Website (.env.local)
```
NEXT_MONGODB_URI=mongodb://username:password@host:port/database
NEXT_MONGODB_DB=testbgremover
```

### Worker (.env)
```
NEXT_MONGODB_URI=mongodb://username:password@host:port/database
NEXT_MONGODB_DB=testbgremover
```

## Connection

### Website Connection
Location: [website/src/lib/mongodb.ts](website/src/lib/mongodb.ts)
- Database: `testbgremover`
- Collection: `jobs`

### Worker Connection
Location: [worker/server.py](worker/server.py)
- Database: `testbgremover` (or custom via `NEXT_MONGODB_DB`)
- Collection: `jobs`
- TTL Auto-Deletion: Configured via `expiresAt` index

## Collections Summary

| Collection | Purpose | TTL | Auto-Delete |
|-----------|---------|-----|------------|
| `jobs` | Job queue for async processing | 10 minutes | Yes (expiresAt index) |
| `user_uploads` | Tracks individual uploads | 1 hour | Yes (uploadedAt index) |
| `hourly_usage` | Rate limiting counter per IP/hour | 1 hour | Yes (expiresAt index) |
| `analytics` | Daily job & user counts | N/A | No (retained for history) |
| `analytics_seen` | Dedup unique users per day | 25 hours | Yes (createdAt index) |