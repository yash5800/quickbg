# Database Design

## Overview

The project uses **MongoDB** as its primary database for job management and queue processing.

## Database Name

```
bgremover
```

## Collections

### jobs Collection

The main collection storing all image processing jobs.

#### Schema

```javascript
{
  _id: ObjectId,           // MongoDB unique identifier
  jobId: string,          // Unique job identifier (UUID)
  status: string,        // Job status: "queued" | "running" | "completed" | "failed"
  progress: number,      // Progress percentage (0-100)
  createdAt: Date,        // Job creation timestamp
  completedAt: Date,     // Job completion timestamp (optional)
  fileName: string,      // Original uploaded filename
  sessionId: string,     // User session identifier
  resultPath?: string,   // Path to processed result file (optional)
  error?: string,        // Error message if failed (optional)
  queuePosition?: number, // Position in queue (optional)
  estimatedWait?: number  // Estimated wait time in seconds (optional)
}
```

#### Indexes

```javascript
// Index for session-based queries with sorting
{ sessionId: 1, createdAt: -1 }

// Unique index on jobId
{ jobId: 1 }
```

#### Example Document

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  jobId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  status: "completed",
  progress: 100,
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  completedAt: ISODate("2024-01-15T10:30:45Z"),
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

### Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job waiting in queue |
| `running` | Currently being processed |
| `completed` | Successfully processed |
| `failed` | Processing failed |

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

#### Cleanup old jobs
```javascript
db.jobs.deleteMany({
  createdAt: { $lt: cutoffDate },
  status: { $in: ["completed", "failed"] }
})
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

## Environment Variables

### Website (.env.local)
```
NEXT_MONGODB_URI=mongodb://username:password@host:port/database
NEXT_MONGODB_DB=bgremover
```

### Worker (.env)
```
NEXT_MONGODB_URI=mongodb://username:password@host:port/database
NEXT_MONGODB_DB=bgremover
```

## Cleanup Strategy

- **Job Retention**: Jobs are deleted after 7 days (configurable)
- **Completed/Failed Only**: Only terminal status jobs are cleaned up
- **Scheduled**: Cleanup runs automatically via `cleanupOldJobs()` function

## Connection

### Website Connection
Location: `website/src/lib/mongodb.ts`
- Database: `bgremover`
- Collection: `jobs`

### Worker Connection
Location: `worker/server.py`
- Database: `bgremover` (or custom via `NEXT_MONGODB_DB`)
- Collection: `jobs`