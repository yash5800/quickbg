# API Routes

## Public API Routes

### Image Operations
- `POST /api/image` - Upload and process image
- `POST /api/remove-background` - Remove background from image
- `GET /api/result/[jobId]` - Get processed image result
- `GET /api/status/[jobId]` - Get job processing status
- `GET /api/queue-status` - Get overall queue status

### Jobs Management
- `GET /api/jobs` - List all jobs
- `DELETE /api/jobs/[id]` - Delete specific job

## Admin API Routes

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/session` - Get current session (includes credits)

### Analytics & Stats
- `GET /api/admin/analytics` - Usage analytics data
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/recent-jobs` - Recent jobs list

### Data Management
- `POST /api/admin/cleanup` - Clean up old data
- `DELETE /api/admin/delete-all-data` - Delete all data (dangerous)

## Worker API Routes (Internal)

The Worker service exposes:
- `POST /process` - Submit image for processing
- `GET /status/[jobId]` - Get job status
- `GET /result/[jobId]` - Get processed result

## Response Formats

### Job Status Response
```json
{
  "status": "queued|running|completed|error",
  "progress": 0-100,
  "queue_position": 1,
  "estimated_wait_seconds": 60
}
```

### Result Response
Binary image data (PNG/JPEG)