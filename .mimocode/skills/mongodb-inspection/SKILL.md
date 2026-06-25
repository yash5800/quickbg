---
name: mongodb-inspection
description: "Query and inspect MongoDB collections for job status, credits, and debugging"
---

# MongoDB Inspection Skill

This skill provides a standardized workflow for inspecting MongoDB collections in the quickbg project, particularly for debugging job processing, credits, and user data.

## When to Use

- Debugging job processing issues
- Checking credit deductions
- Investigating failed jobs
- Monitoring queue state
- Verifying data integrity

## Prerequisites

- Python virtual environment at `.venv`
- MongoDB connection string in environment variables
- pymongo installed in virtual environment

## Workflow

### 1. Basic Connection Test

```python
# Quick connection test
source .venv/bin/activate && python3 -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()
uri = os.environ.get('NEXT_MONGODB_URI')
client = MongoClient(uri, serverSelectionTimeoutMS=5000)
try:
    client.admin.command('ping')
    print('MongoDB connection successful')
except Exception as e:
    print(f'Connection failed: {e}')
"
```

### 2. Check Job Status

```python
# List recent jobs and their status
source .venv/bin/activate && python3 -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
load_dotenv()
uri = os.environ.get('NEXT_MONGODB_URI')
client = MongoClient(uri)
db = client[os.environ.get('MONGO_DB_NAME', 'quickbg')]

# Get jobs from last 24 hours
cutoff = datetime.utcnow() - timedelta(hours=24)
jobs = list(db.jobs.find({'created_at': {'$gte': cutoff}}).sort('created_at', -1).limit(20))

print(f'Found {len(jobs)} jobs in last 24 hours:')
for job in jobs:
    print(f\"  {job.get('status', 'unknown')}: {job.get('job_id', 'no-id')} - {job.get('created_at', 'no-date')}\")
"
```

### 3. Check Credit Deductions

```python
# Check credit history for a user
source .venv/bin/activate && python3 -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()
uri = os.environ.get('NEXT_MONGODB_URI')
client = MongoClient(uri)
db = client[os.environ.get('MONGO_DB_NAME', 'quickbg')]

# Find user credits
credits = list(db.credits.find().limit(10))
print(f'Found {len(credits)} credit records:')
for credit in credits:
    print(f\"  User {credit.get('user_id', 'unknown')}: {credit.get('credits', 0)} credits\")
"
```

### 4. Check Failed Jobs

```python
# Find failed or stuck jobs
source .venv/bin/activate && python3 -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
load_dotenv()
uri = os.environ.get('NEXT_MONGODB_URI')
client = MongoClient(uri)
db = client[os.environ.get('MONGO_DB_NAME', 'quickbg')]

# Find jobs that are processing for too long (stuck)
stuck_cutoff = datetime.utcnow() - timedelta(hours=1)
stuck_jobs = list(db.jobs.find({
    'status': 'processing',
    'started_at': {'$lt': stuck_cutoff}
}))

print(f'Found {len(stuck_jobs)} stuck jobs:')
for job in stuck_jobs:
    print(f\"  Job {job.get('job_id', 'unknown')} - started {job.get('started_at', 'unknown')}\")
"
```

### 5. Debug Specific Job

```python
# Get details for a specific job
source .venv/bin/activate && python3 -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()
uri = os.environ.get('NEXT_MONGODB_URI')
client = MongoClient(uri)
db = client[os.environ.get('MONGO_DB_NAME', 'quickbg')]

# Replace with actual job_id
job_id = 'YOUR_JOB_ID'
job = db.jobs.find_one({'job_id': job_id})
if job:
    print(f'Job {job_id}:')
    for key, value in job.items():
        print(f'  {key}: {value}')
else:
    print(f'Job {job_id} not found')
"
```

## Common Queries

### Check All Collections

```bash
# List all collections in the database
source .venv/bin/activate && python3 -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()
uri = os.environ.get('NEXT_MONGODB_URI')
client = MongoClient(uri)
db = client[os.environ.get('MONGO_DB_NAME', 'quickbg')]
print('Collections:', db.list_collection_names())
"
```

### Count Documents

```bash
# Count documents in a collection
source .venv/bin/activate && python3 -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()
uri = os.environ.get('NEXT_MONGODB_URI')
client = MongoClient(uri)
db = client[os.environ.get('MONGO_DB_NAME', 'quickbg')]
print('Jobs count:', db.jobs.count_documents({}))
print('Credits count:', db.credits.count_documents({}))
"
```

## Troubleshooting

### Connection Issues

1. Verify MongoDB URI in environment variables
2. Check network connectivity
3. Verify MongoDB Atlas IP whitelist (if using Atlas)

### Query Performance

1. Ensure proper indexes exist
2. Use `explain()` to analyze query plans
3. Limit results for large collections

### Data Inconsistencies

1. Check job status transitions
2. Verify credit deductions match job completions
3. Look for duplicate job IDs

## Environment Variables

- `NEXT_MONGODB_URI`: MongoDB connection string
- `MONGO_DB_NAME`: Database name (default: 'quickbg')

## Files

- Worker code: `worker/server.py` (uses MongoDB)
- Website API: `website/src/app/api/` (uses MongoDB)
