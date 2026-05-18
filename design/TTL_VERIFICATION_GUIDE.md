# TTL Auto-Deletion Verification Guide

## What to Look For in Console Logs

When your application is running, watch for these console log patterns to verify TTL is working:

---

## 1. Startup Logs

**When the worker starts:**

```
Loading model...
Model loaded on cuda
[MongoDB] Connection established and indexes created
```

✅ **What this means:** MongoDB connected successfully and TTL indexes created

---

## 2. Job Creation Logs

**When a new job is submitted:**

```
[Job a1b2c3d4-e5f6-7890-abcd-ef1234567890] Created - expires at 2024-01-22T10:30:00Z
```

✅ **What this means:**
- Job was inserted into database
- `expiresAt` timestamp was set
- 7 days from creation (configured via `JOB_RETENTION_HOURS`)
- **On 2024-01-22T10:30:00Z, MongoDB will automatically delete this job**

---

## 3. Job Lifecycle Logs

**As the job processes:**

```
[Job a1b2c3d4] Claimed for processing
[Job a1b2c3d4] Processing started
[Job a1b2c3d4] Image loaded: 2048576 bytes
[Job a1b2c3d4] Image processed and saved
[Job a1b2c3d4] Successfully completed
```

✅ **What this means:**
- Job went through all stages: queued → starting → running → completed
- All stages have `updatedAt` timestamp recorded
- When `expiresAt` is reached, **MongoDB will automatically delete this job**

---

## 4. TTL Cleanup Monitoring Logs

**Every 30 minutes (CLEANUP_INTERVAL_SECONDS), you'll see:**

### Case A: No Expiring Documents

```
[TTL Cleanup] 0 documents awaiting TTL deletion (expiresAt < now)
```

✅ **What this means:**
- No jobs have reached their expiration date yet
- TTL monitor is running and checking
- Everything is normal

### Case B: Some Documents Expiring

```
[TTL Cleanup] 5 documents awaiting TTL deletion (expiresAt < now)
[TTL Cleanup] Sample jobs expiring in next hour: 3 found
  - Job a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Status: completed | Expires: 2024-01-22T10:30:00Z
  - Job b2c3d4e5-f6g7-8901-bcde-f12345678901 | Status: failed | Expires: 2024-01-22T11:15:00Z
  - Job c3d4e5f6-g7h8-9012-cdef-123456789012 | Status: completed | Expires: 2024-01-22T12:45:00Z
[TTL Cleanup] Total documents marked for TTL deletion: 5
```

✅ **What this means:**
- 5 jobs currently have `expiresAt` < current time
- MongoDB TTL background thread will delete these soon
- The sample shows the next 3 jobs to be deleted within 1 hour
- **If these counts stay high, check MongoDB logs to ensure TTL is actually deleting**

---

## 5. Failed Job Logs

**When a job fails:**

```
[Job c3d4e5f6] Job not found, skipping
```

or

```
[Job d4e5f6g7] Processing started
[Job d4e5f6g7] Image loaded: 1024768 bytes
[Job d4e5f6g7] Failed: Input file not found
```

✅ **What this means:**
- Job was recorded as "failed"
- Still subject to TTL deletion (will be deleted after 7 days)
- Same expiration rules apply

---

## 6. Check MongoDB TTL Is Actually Working

### In MongoDB Shell

```javascript
// Connect to your MongoDB
use testbgremover

// Check documents with expiresAt in the past
db.jobs.find({"expiresAt": {"$lt": new Date()}})

// Count them
db.jobs.countDocuments({"expiresAt": {"$lt": new Date()}})

// If count > 0 and not decreasing over time, TTL might not be running
// Check that the index exists:
db.jobs.getIndexes()

// Look for:
// {
//   "key": {"expiresAt": 1},
//   "expireAfterSeconds": 0
// }
```

---

## 7. Monitoring TTL Effectiveness

### Good Indicators ✅

1. **Console logs show expiring documents**
   ```
   [TTL Cleanup] 3 documents awaiting TTL deletion
   ```

2. **Count decreases over time**
   ```
   [TTL Cleanup] 3 documents awaiting TTL deletion (moment 1)
   ...wait 30 minutes...
   [TTL Cleanup] 0 documents awaiting TTL deletion (moment 2)
   ```

3. **MongoDB doesn't grow infinitely**
   - Check database storage size
   - Should stabilize as old jobs are deleted

### Bad Indicators ❌

1. **Expiring count always high**
   ```
   [TTL Cleanup] 100 documents awaiting TTL deletion
   [TTL Cleanup] 100 documents awaiting TTL deletion  (30 min later - should have decreased!)
   ```
   **Fix:** Verify TTL index exists: `db.jobs.getIndexes()`

2. **TTL logs never appear**
   ```
   No [TTL Cleanup] messages in console
   ```
   **Fix:** Check `LOG_LEVEL` environment variable, should be "INFO"

3. **Database size grows without bound**
   **Fix:** Check MongoDB configuration - TTL background thread might be disabled

---

## Understanding the Timestamps

### Job Creation Timestamp Flow

```
Now (2024-01-15T10:30:00Z)
    ↓
[Job Created] - expires at 2024-01-22T10:30:00Z
    ↓
Job Record:
  jobId: "a1b2c3d4-..."
  createdAt: 2024-01-15T10:30:00Z
  updatedAt: 2024-01-15T10:30:00Z
  expiresAt: 2024-01-22T10:30:00Z  ← 7 days later
    ↓
2024-01-22T10:30:00Z Arrives
    ↓
MongoDB TTL Background Thread Checks:
  if (expiresAt < now) → DELETE
    ↓
Document Deleted!
```

---

## Configuration Environment Variables

### TTL Configuration

```bash
# Worker environment variables
WORKER_JOB_RETENTION_HOURS=168        # Default: 7 days (168 hours)
WORKER_CLEANUP_INTERVAL_SECONDS=1800  # Check every 30 minutes

# MongoDB connection
NEXT_MONGODB_URI=mongodb://...
NEXT_MONGODB_DB=testbgremover

# Logging
LOG_LEVEL=INFO  # Set to DEBUG for more detailed logs
```

### To Change TTL Duration

```bash
# 24 hours retention
WORKER_JOB_RETENTION_HOURS=24

# 1 hour retention (for testing)
WORKER_JOB_RETENTION_HOURS=1

# 30 days retention
WORKER_JOB_RETENTION_HOURS=720
```

---

## Testing TTL (Development)

### Quick Test (1-minute TTL)

```bash
# Set retention to 1 minute for testing
export WORKER_JOB_RETENTION_HOURS=0  # Won't work, need 1 hour minimum actually
export WORKER_JOB_RETENTION_HOURS=1  # 60 minutes

# Or create manual test:
# Create a job, set expiresAt to 1 minute ago
db.jobs.insertOne({
  jobId: "test-ttl-job",
  status: "completed",
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() - 60000),  // 1 minute ago
  fileName: "test.jpg"
})

# Wait for TTL cleanup cycle (~30 seconds for testing)
# Check console for: [TTL Cleanup] 1 documents awaiting TTL deletion

# Verify it was deleted
db.jobs.findOne({jobId: "test-ttl-job"})  // Should return null
```

---

## Real-World Monitoring

### Dashboard Command (Linux/Mac)

```bash
# Watch TTL cleanup logs in real-time
tail -f /path/to/worker.log | grep "TTL Cleanup"
```

### Sample Output (Every 30 minutes):

```
2024-01-15T11:00:00Z [TTL Cleanup] 0 documents awaiting TTL deletion (expiresAt < now)
2024-01-15T11:30:00Z [TTL Cleanup] 0 documents awaiting TTL deletion (expiresAt < now)
2024-01-15T12:00:00Z [TTL Cleanup] 3 documents awaiting TTL deletion (expiresAt < now)
2024-01-15T12:00:00Z [TTL Cleanup] Sample jobs expiring in next hour: 3 found
2024-01-15T12:00:00Z [TTL Cleanup] Total documents marked for TTL deletion: 3
2024-01-15T12:30:00Z [TTL Cleanup] 0 documents awaiting TTL deletion (expiresAt < now)  ← Deleted!
2024-01-15T13:00:00Z [TTL Cleanup] 0 documents awaiting TTL deletion (expiresAt < now)
```

---

## Troubleshooting

### Problem: No TTL Cleanup logs

**Check:**
```bash
# 1. Is LOG_LEVEL set correctly?
echo $LOG_LEVEL  # Should be INFO or DEBUG, not ERROR

# 2. Is cleanup_loop running?
ps aux | grep python  # Look for worker process

# 3. Is MongoDB connected?
# Look for: [MongoDB] Connection established
```

### Problem: Expiring documents not being deleted

**Check:**
```javascript
// 1. Verify TTL index exists
db.jobs.getIndexes()
// Look for: {"key": {"expiresAt": 1}, "expireAfterSeconds": 0}

// 2. Verify documents have expiresAt
db.jobs.findOne({})
// Should have: expiresAt: Date

// 3. Check MongoDB configuration
db.adminCommand({getParameter: 1, ttlMonitorSleepSecs: 1})
// If TTL is disabled, MongoDB admin needs to enable it
```

### Problem: Too much storage used

**Check:**
```javascript
// Count total documents
db.jobs.countDocuments({})

// Count expired documents not yet deleted
db.jobs.countDocuments({expiresAt: {$lt: new Date()}})

// If large count, TTL might not be working
// Force delete for troubleshooting (not recommended in production):
db.jobs.deleteMany({expiresAt: {$lt: new Date()}})
```

---

## Summary Checklist

- [ ] Console shows `[MongoDB] Connection established and indexes created` on startup
- [ ] Console shows `[Job {id}] Created - expires at {date}` when jobs are created
- [ ] Console shows job lifecycle logs (Claimed, Processing started, Completed)
- [ ] Every 30 minutes, console shows `[TTL Cleanup]` log output
- [ ] TTL cleanup count eventually decreases (documents being deleted)
- [ ] MongoDB database size stabilizes (not growing infinitely)
- [ ] No errors in MongoDB logs related to TTL

✅ **If all checks pass, TTL auto-deletion is working correctly!**
