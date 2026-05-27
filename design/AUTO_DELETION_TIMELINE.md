# Auto-Deletion Timeline & Schedule

**Documentation for MongoDB TTL-based automatic deletions**

---

## Overview

Documents are automatically deleted by MongoDB's TTL (Time-To-Live) background thread when their `expiresAt` timestamp passes. This document explains the timing of these deletions across all collections.

---

## Collections & TTL Configuration

### 1. **jobs Collection** - 7-Day Retention

| Field | TTL Config | Example |
|-------|-----------|---------|
| `expiresAt` | 7 days (604,800 seconds) | Created: Jan 15 → Deleted: Jan 22 |
| Index | `{expiresAt: 1}` expireAfterSeconds=0 | TTL = 0 means delete exactly at timestamp |

**Lifecycle Timeline:**
```
Jan 15, 10:30 AM     ← Job created
  ↓
expiresAt = Jan 22, 10:30 AM
  ↓
Jan 22, 10:30 AM     ← MongoDB TTL thread checks
  ↓
Jan 22, 10:35 AM     ← Document deleted (within 5 minutes after TTL time)
```

### 2. **user_uploads Collection** - 1-Hour Retention

| Field | TTL Config | Example |
|-------|-----------|---------|
| `uploadedAt` | 1 hour (3,600 seconds) | Created: 10:30 AM → Deleted: 11:30 AM |
| Index | `{uploadedAt: 1}` expireAfterSeconds=3600 | |

**Lifecycle Timeline:**
```
10:30 AM             ← Upload tracked
  ↓
uploadedAt + 3600s = 11:30 AM
  ↓
11:30 AM             ← MongoDB TTL thread checks
  ↓
11:35 AM             ← Document deleted (within 5 minutes)
```

### 3. **hourly_usage Collection** - 1-Hour Retention

| Field | TTL Config | Example |
|-------|-----------|---------|
| `expiresAt` | 1 hour | Created: 10:00 AM → Deleted: 11:00 AM |
| Index | `{expiresAt: 1}` expireAfterSeconds=0 | Set to next hour boundary |

**Lifecycle Timeline:**
```
10:00 AM             ← Rate limit counter created
  ↓
expiresAt = 11:00 AM (next hour boundary)
  ↓
11:00 AM             ← MongoDB TTL thread checks
  ↓
11:05 AM             ← Document deleted
```

### 4. **analytics_seen Collection** - 25-Hour Retention

| Field | TTL Config | Example |
|-------|-----------|---------|
| `createdAt` | 25 hours (90,000 seconds) | Created: Jan 15, 10:30 AM → Deleted: Jan 16, 11:30 AM |
| Index | `{createdAt: 1}` expireAfterSeconds=90000 | Dedup hashes stored temporarily |

**Lifecycle Timeline:**
```
Jan 15, 10:30 AM     ← User hash tracked for dedup
  ↓
createdAt + 90000s = Jan 16, 11:30 AM
  ↓
Jan 16, 11:30 AM     ← MongoDB TTL thread checks
  ↓
Jan 16, 11:35 AM     ← Document deleted
```

---

## MongoDB TTL Background Thread Schedule

### How TTL Works

MongoDB's TTL background thread runs on a **60-second interval** by default:

```
00:00:00 → Check all TTL indexes
00:01:00 → Check all TTL indexes
00:02:00 → Check all TTL indexes
... (every 60 seconds)
```

**Important:** Deletions happen **within 5 minutes** of the TTL timestamp, not exactly at that moment.

### TTL Thread Behavior

```javascript
// MongoDB TTL Background Thread (simplified)
setInterval(() => {
  // For each TTL index
  collections.forEach(collection => {
    // Find all documents where TTL field < current time
    expired = collection.find({
      ttlField: { $lt: Date.now() }
    })
    
    // Delete them in batches
    expired.forEach(doc => {
      collection.deleteOne({_id: doc._id})
    })
  })
}, 60000)  // Every 60 seconds
```

---

## Deletion Timeline Examples

### Example 1: Job Created on Jan 15

```
Timeline:
─────────────────────────────────────────────────────

Jan 15, 10:30:00 AM
  └─ POST /remove (job submitted)
  └─ Job created in database
  └─ expiresAt = Jan 22, 10:30:00 AM (7 days later)
  └─ Console log: "[Job a1b2c3d4] Created - expires at 2024-01-22T10:30:00Z"

Jan 15-22 (7 days)
  └─ Job processes, completes, sits in database
  └─ updatedAt field tracks all changes
  └─ Data retained for 7 days as configured

Jan 22, 10:30:00 AM
  └─ TTL timestamp reached
  └─ MongoDB TTL background thread detects: expiresAt < now
  └─ Marks for deletion

Jan 22, 10:35:00 AM (within 5 minutes)
  └─ MongoDB deletes document
  └─ Storage freed
  └─ Next cleanup_loop console log shows it was deleted:
     "[TTL Cleanup] Sample jobs expiring in next hour: 0 found"
```

### Example 2: Upload Tracked at 10:30 AM

```
Timeline:
─────────────────────────────────────────────────────

10:30:00 AM
  └─ User uploads file
  └─ user_uploads.insertOne({ip, fileName, uploadedAt: now, hourKey})
  └─ Hourly rate limit incremented (hourly_usage)

11:30:00 AM (exactly 1 hour later)
  └─ TTL timestamp reached
  └─ MongoDB TTL thread: uploadedAt < now
  └─ Marks for deletion

11:35:00 AM
  └─ user_uploads document deleted
  └─ hourly_usage document also expires at this time
  └─ Storage freed
  └─ User can upload another file
```

### Example 3: Analytics Tracking Jan 15

```
Timeline:
─────────────────────────────────────────────────────

Jan 15, 10:30:00 AM
  └─ User processes image (job completed)
  └─ record_analytics(client_key) called
  └─ analytics_seen.insertOne({date, h: hash(client_key), createdAt: now})
  └─ Hash stored for dedup

Jan 16, 11:30:00 AM (25 hours later)
  └─ TTL timestamp reached: createdAt + 90000s
  └─ MongoDB TTL thread detects expiration
  └─ Marks for deletion

Jan 16, 11:35:00 AM
  └─ analytics_seen document deleted
  └─ Hash removed from dedup store
  └─ Same user can be counted as "new" again next day
  └─ Storage freed
```

---

## Deletion Verification via Console Logs

### Monitoring When Deletions Happen

The `cleanup_loop()` in worker runs every 30 minutes and logs expiring documents:

```python
# Run every 30 minutes (CLEANUP_INTERVAL_SECONDS = 1800)
async def cleanup_loop():
    while True:
        now = utcnow()
        
        # Count documents with expiresAt < now
        expired_count = collection.count_documents({"expiresAt": {"$lt": now}})
        
        if expired_count > 0:
            logger.info(f"[TTL Cleanup] {expired_count} documents awaiting TTL deletion")
            
            # Show sample of jobs expiring in next hour
            soon_expire = now + timedelta(hours=1)
            expiring_soon = list(collection.find({
                "expiresAt": {"$gte": now, "$lte": soon_expire}
            }).limit(5))
            
            logger.info(f"[TTL Cleanup] Sample jobs expiring: {len(expiring_soon)} found")
        
        await asyncio.sleep(1800)  # Wait 30 minutes
```

### Reading the Logs

**Scenario 1: Just created 5 jobs**
```
10:30:00 [TTL Cleanup] 0 documents awaiting TTL deletion (expiresAt < now)
10:31:00 [Job a1b2c3d4] Created - expires at 2024-01-22T10:30:00Z
10:31:00 [Job b2c3d4e5] Created - expires at 2024-01-22T10:30:00Z
... 3 more jobs ...
```

**Scenario 2: 7 days later**
```
Jan 22, 10:30:00
[TTL Cleanup] 5 documents awaiting TTL deletion (expiresAt < now)
[TTL Cleanup] Sample jobs expiring in next hour: 5 found
  - Job a1b2c3d4 | Status: completed | Expires: 2024-01-22T10:30:00Z
  - Job b2c3d4e5 | Status: failed | Expires: 2024-01-22T10:30:00Z
  - Job c3d4e5f6 | Status: completed | Expires: 2024-01-22T10:30:00Z
  - Job d4e5f6g7 | Status: completed | Expires: 2024-01-22T10:30:00Z
  - Job e5f6g7h8 | Status: completed | Expires: 2024-01-22T10:30:00Z
[TTL Cleanup] Total documents marked for TTL deletion: 5

... MongoDB deletes these in the background ...

Jan 22, 11:00:00 (30 min later)
[TTL Cleanup] 0 documents awaiting TTL deletion (expiresAt < now)  ← Deleted!
```

---

## Deletion Timeline by Collection

### jobs Collection

```
┌─────────────────────────────────────────────────────────────┐
│ Day 1, 10:30 AM: Job Created                               │
│ expiresAt = Day 8, 10:30 AM (7 days)                       │
├─────────────────────────────────────────────────────────────┤
│ Days 1-7: Job stored and available                         │
│ (7 × 24 × 60 = 10,080 minutes)                             │
├─────────────────────────────────────────────────────────────┤
│ Day 8, 10:30 AM: TTL Trigger                               │
│ MongoDB TTL background checks: expiresAt < now             │
├─────────────────────────────────────────────────────────────┤
│ Day 8, 10:35 AM: Document Deleted                          │
│ (within 5 minutes of TTL timestamp)                        │
│ Storage freed, document no longer queryable               │
└─────────────────────────────────────────────────────────────┘
```

### user_uploads Collection

```
┌──────────────────────────────────────────────────────────┐
│ 10:30 AM: Upload Tracked                                 │
│ uploadedAt = 10:30 AM                                    │
│ TTL = 3600 seconds (1 hour)                              │
├──────────────────────────────────────────────────────────┤
│ 10:30 - 11:30 AM: Upload data retained (60 minutes)     │
├──────────────────────────────────────────────────────────┤
│ 11:30 AM: TTL Trigger                                    │
│ uploadedAt + 3600 < now                                  │
├──────────────────────────────────────────────────────────┤
│ 11:35 AM: Document Deleted                               │
│ (within 5 minutes)                                       │
│ Upload tracking removed from database                   │
└──────────────────────────────────────────────────────────┘
```

### hourly_usage Collection

```
┌──────────────────────────────────────────────────────────┐
│ 10:00 AM: Hour Starts                                    │
│ expiresAt = 11:00 AM (end of hour)                       │
├──────────────────────────────────────────────────────────┤
│ 10:00 - 11:00 AM: Rate limit tracking (60 minutes)      │
│ Count increments as users upload                        │
├──────────────────────────────────────────────────────────┤
│ 11:00 AM: TTL Trigger                                    │
│ expiresAt < now (hour ended)                             │
├──────────────────────────────────────────────────────────┤
│ 11:05 AM: Document Deleted                               │
│ (within 5 minutes)                                       │
│ Rate limit counter reset for new hour                   │
└──────────────────────────────────────────────────────────┘
```

### analytics_seen Collection

```
┌────────────────────────────────────────────────────────────┐
│ Jan 15, 10:30 AM: User Hash Stored                        │
│ createdAt = Jan 15, 10:30 AM                              │
│ TTL = 90000 seconds (25 hours)                            │
├────────────────────────────────────────────────────────────┤
│ Jan 15, 10:30 AM - Jan 16, 11:30 AM: Dedup Active       │
│ (25 hours)                                                │
│ Hash prevents duplicate user counting                    │
├────────────────────────────────────────────────────────────┤
│ Jan 16, 11:30 AM: TTL Trigger                             │
│ createdAt + 90000 < now                                   │
├────────────────────────────────────────────────────────────┤
│ Jan 16, 11:35 AM: Document Deleted                        │
│ (within 5 minutes)                                        │
│ Hash removed, user can be counted as new again           │
└────────────────────────────────────────────────────────────┘
```

---

## Batch Deletion Patterns

### Peak Load Scenario

If many jobs complete at the same time:

```
Example: 1000 jobs all completing around same time

Day 1, 10:30 AM
  └─ 1000 jobs submitted in batch
  └─ All set: expiresAt = Day 8, 10:30 AM

Day 8, 10:30 AM - 10:35 AM
  └─ MongoDB TTL deletes ~1000 documents
  └─ Happens in batches to avoid overwhelming database
  └─ Typical rate: 100-500 docs/batch

Jan 22, 10:35:00
[TTL Cleanup] 1000 documents awaiting TTL deletion (expiresAt < now)
[TTL Cleanup] Sample jobs expiring in next hour: 5 found
  - Job xxx | Status: completed | Expires: 2024-01-22T10:30:00Z
  - Job yyy | Status: completed | Expires: 2024-01-22T10:30:00Z
  ... 3 more ...
[TTL Cleanup] Total documents marked for TTL deletion: 1000

... MongoDB deletes in batches over 5 minutes ...

Jan 22, 11:00:00
[TTL Cleanup] 0 documents awaiting TTL deletion (expiresAt < now)
```

---

## Configuration & Timing

### Environment Variables

```bash
# How long to keep jobs (in hours)
WORKER_JOB_RETENTION_HOURS=168  # 7 days = 168 hours

# How often to check for expired documents
WORKER_CLEANUP_INTERVAL_SECONDS=1800  # 30 minutes

# MongoDB configuration (handled by MongoDB, not overridable)
# TTL background thread interval: ~60 seconds (MongoDB default)
# Expiration within: ~5 minutes of TTL timestamp
```

### To Change TTL Duration

```bash
# 1 day retention (24 hours)
export WORKER_JOB_RETENTION_HOURS=24

# 3 days retention (72 hours)
export WORKER_JOB_RETENTION_HOURS=72

# 14 days retention (336 hours)
export WORKER_JOB_RETENTION_HOURS=336

# 1 month retention (720 hours)
export WORKER_JOB_RETENTION_HOURS=720
```

---

## Deletion Status Monitoring

### Check What's About to Be Deleted

```javascript
// Connect to MongoDB

// Jobs expiring in next 1 hour
db.jobs.find({
  expiresAt: {
    $gte: new Date(),
    $lte: new Date(Date.now() + 3600000)
  }
}).sort({expiresAt: 1}).limit(10)

// Jobs already expired (awaiting deletion)
db.jobs.find({
  expiresAt: {
    $lt: new Date()
  }
}).count()

// All jobs retention status
db.jobs.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      expired: {
        $sum: {
          $cond: [{ $lt: ["$expiresAt", new Date()] }, 1, 0]
        }
      },
      expiring_soon: {
        $sum: {
          $cond: [
            {
              $and: [
                { $gte: ["$expiresAt", new Date()] },
                { $lte: ["$expiresAt", new Date(Date.now() + 3600000)] }
              ]
            },
            1,
            0
          ]
        }
      }
    }
  }
])

// Result example:
// {
//   _id: null,
//   total: 5000,        // Total documents
//   expired: 125,       // Already past TTL (awaiting deletion)
//   expiring_soon: 42   // Expiring within 1 hour
// }
```

---

## Common Questions

### Q: When exactly are documents deleted?

**A:** Within ~5 minutes after the TTL timestamp. MongoDB's TTL background thread runs every 60 seconds and marks documents for deletion. The actual deletion happens within that window.

Example:
- TTL timestamp: Jan 22, 10:30:00
- Deletion window: Jan 22, 10:30:00 - 10:35:00

### Q: What if MongoDB is down when TTL expires?

**A:** The document won't be deleted. When MongoDB comes back up, the TTL thread will resume and delete documents that are past their TTL timestamp.

### Q: Can I prevent a document from being deleted?

**A:** Yes, update its `expiresAt` field to a future date:
```javascript
db.jobs.updateOne(
  { jobId: "a1b2c3d4" },
  { $set: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
)  // Extend to 30 days from now
```

### Q: Can I manually delete documents before TTL?

**A:** Yes:
```javascript
db.jobs.deleteOne({ jobId: "a1b2c3d4" })
```

### Q: How do I know if TTL is working?

**A:** 
1. Check console logs for `[TTL Cleanup]` messages
2. Run count query to see expired documents
3. Run same query 5 minutes later - count should decrease
4. Watch database size over time - should stabilize

---

## Summary Table

| Collection | TTL Field | Duration | Check Interval | Deletion Window |
|-----------|-----------|----------|-----------------|-----------------|
| jobs | expiresAt | 7 days | Every 60s | Within 5 min |
| user_uploads | uploadedAt | 1 hour | Every 60s | Within 5 min |
| hourly_usage | expiresAt | 1 hour | Every 60s | Within 5 min |
| analytics_seen | createdAt | 25 hours | Every 60s | Within 5 min |

---

**Last Updated:** May 12, 2026  
**Status:** ✅ All TTL indexes active and verified
