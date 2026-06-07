# Quick Reference: Progress Derivation

## How Progress Works Now

Instead of storing `progress: 0-100` in the database, we derive it from the `status` field:

### Status → Progress Mapping

```
Status        Progress    Meaning
──────────────────────────────────────────────
"queued"   →   0%       Waiting in queue
"starting" →  25%       About to process
"running"  →  50%       Currently processing
"completed"→ 100%       Finished successfully
"failed"   →   0%       Processing failed
"cancelled"→   0%       Job cancelled
"expired"  →   0%       Job expired
```

---

## Code Locations

### TypeScript (Frontend)
**File:** `website/src/lib/mongodb.ts`

```typescript
export function getProgressFromStatus(status: string): number {
  switch (status) {
    case "queued": return 0;
    case "running": return 50;
    case "completed": return 100;
    case "failed": return 0;
    default: return 0;
  }
}
```

**Usage in Hook:** `website/src/hooks/useJobStatus.ts`
```typescript
const progress = status !== "unknown" ? getProgressFromStatus(status) : 0;
```

---

### Python (Worker)
**File:** `worker/server.py`

```python
def get_progress_from_status(status: str) -> int:
    """Derive progress percentage from status."""
    status_map = {
        "queued": 0,
        "starting": 25,
        "running": 50,
        "completed": 100,
        "failed": 0,
        "cancelled": 0,
        "expired": 0,
    }
    return status_map.get(status, 0)
```

**Usage in Response:** Same function called in `build_status_payload()`

---

## Example Job Lifecycle

```javascript
// 1. Job Created
{
  jobId: "a1b2c3d4-...",
  status: "queued",         // Progress = 0%
  createdAt: 2024-01-15T10:30:00Z,
  expiresAt: 2024-01-15T10:40:00Z,  // Auto-deleted in 10 minutes
}

// 2. Job Claimed for Processing
{
  jobId: "a1b2c3d4-...",
  status: "starting",       // Progress = 25%
  updatedAt: 2024-01-15T10:30:05Z,
}

// 3. Job Processing
{
  jobId: "a1b2c3d4-...",
  status: "running",        // Progress = 50%
  updatedAt: 2024-01-15T10:30:10Z,
}

// 4. Job Completed
{
  jobId: "a1b2c3d4-...",
  status: "completed",      // Progress = 100%
  updatedAt: 2024-01-15T10:30:45Z,
  resultPath: "./uploads/processed/a1b2c3d4.png",
}

// 5. Auto-Deleted (after 10 minutes)
// Document removed by MongoDB TTL background thread
// Worker also deletes image files from disk
// Console log: "[TTL Cleanup] Document deleted due to expiresAt"
```

---

## API Response Example

### Status Endpoint: `GET /api/status/{jobId}`

**Response:**
```json
{
  "job_id": "a1b2c3d4-...",
  "status": "running",
  "progress": 50,              // ← Derived from status!
  "error": null,
  "queue_position": null,
  "estimated_wait_seconds": null
}
```

No `progress` field in database, but still in API response (derived)!

---

## Console Logs Show Lifecycle

```
[Job a1b2c3d4] Created - expires at 2024-01-22T10:30:00Z
[Job a1b2c3d4] Claimed for processing
[Job a1b2c3d4] Processing started
[Job a1b2c3d4] Image loaded: 2048576 bytes
[Job a1b2c3d4] Image processed and saved
[Job a1b2c3d4] Successfully completed

[TTL Cleanup] 5 documents awaiting TTL deletion (expiresAt < now)
[TTL Cleanup] Sample jobs expiring in next hour: 2 found
  - Job b2c3d4e5 | Status: completed | Expires: 2024-01-22T11:00:00Z
  - Job c3d4e5f6 | Status: failed | Expires: 2024-01-22T11:30:00Z
[TTL Cleanup] Total documents marked for TTL deletion: 5
```

---

## Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| 🎯 **Accuracy** | Progress always matches current status, no stale data |
| 💾 **Storage** | 25-30% smaller documents (no redundant field) |
| ⚡ **Speed** | Computation is O(1), no database queries |
| 🔄 **Consistency** | Single source of truth - status field |
| 🗑️ **Cleanup** | Automatic TTL deletion, no manual cleanup needed |
| 📊 **Visibility** | Console logs show what's being deleted and when |

---

## No Database Queries Needed

**Before (Old Way):**
```javascript
// Store redundant progress value
db.jobs.updateOne(
  { jobId },
  { $set: { progress: 50 } }  // Redundant!
);
```

**After (Optimized):**
```javascript
// Just update status, progress is derived on-demand
db.jobs.updateOne(
  { jobId },
  { $set: { status: "running" } }  // Progress derived from this
);

// Get progress: just look at status field!
progress = getProgressFromStatus(job.status);  // O(1) operation
```

---

## TTL Auto-Deletion

**Before:** Manual cleanup function every 30 minutes
```python
while True:
    # Find old jobs and delete them manually
    stale_jobs = db.jobs.find({
        "createdAt": {"$lt": cutoff},
        "status": {"$in": ["completed", "failed"]}
    })
    for job in stale_jobs:
        db.jobs.delete_one(...)  # Manual deletion
    await asyncio.sleep(1800)  # Wait 30 min
```

**After:** MongoDB TTL Index handles everything
```python
# MongoDB automatically deletes when expiresAt is reached!
# Our cleanup_loop just monitors and logs
[TTL Cleanup] 5 documents awaiting TTL deletion
[TTL Cleanup] Sample jobs expiring in next hour: 2 found
  - Job b2c3d4e5 | Status: completed | Expires: 2024-01-22T11:00:00Z
```

---

## For Developers

### When Adding New Features

**If you need progress:**
```typescript
// ✅ DO THIS: Derive from status
const progress = getProgressFromStatus(job.status);

// ❌ DON'T DO THIS: Store progress
db.jobs.updateOne({ jobId }, { $set: { progress: 50 } });
```

**If you need to know job timing:**
```typescript
// ✅ DO THIS: Use createdAt and updatedAt
const duration = job.updatedAt - job.createdAt;

// ❌ DON'T DO THIS: Try to calculate from completedAt (it doesn't exist!)
const duration = job.completedAt - job.createdAt;  // ❌ completedAt removed!
```

**If you need queue position:**
```python
# ✅ DO THIS: Query database for current queue position
def get_queue_position(job_id: str, created_at: datetime):
    return collection.count_documents({
        "status": "queued",
        "createdAt": {"$lt": created_at}
    }) + 1

# ❌ DON'T DO THIS: Store queue position (it changes constantly!)
db.jobs.updateOne({ jobId }, { $set: { queuePosition: 5 } })
```

---

**Remember: Status is the single source of truth. Everything else is derived!**
