---
name: worker-management
description: "Start, restart, and monitor the background removal worker service"
---

# Worker Management Skill

This skill provides a standardized workflow for managing the background removal worker service in the quickbg project.

## When to Use

- Starting the worker for the first time
- Restarting the worker after code changes
- Checking worker health and queue status
- Debugging worker issues

## Workflow

### 1. Check Worker Status

```bash
# Check if worker is running
ps aux | grep "python3 server" | grep -v grep

# Check worker health endpoint
curl -s http://localhost:8000/health

# Check queue status
curl -s "http://localhost:8000/queue-status" -H "x-internal-token: luffy@10HDLBNndnv"
```

### 2. Start Worker

```bash
# Start worker in background with logging
source .venv/bin/activate && python3 server.py > /tmp/worker.log 2>&1 &

# Wait for startup and verify
sleep 3 && curl -s http://localhost:8000/health
```

### 3. Restart Worker

```bash
# Kill existing worker process
pkill -f "python3 server.py"

# Wait for process to stop
sleep 2

# Start worker again
source .venv/bin/activate && python3 server.py > /tmp/worker.log 2>&1 &
```

### 4. Monitor Worker Logs

```bash
# Check recent logs
tail -30 /tmp/worker.log

# Follow logs in real-time (if needed)
tail -f /tmp/worker.log
```

### 5. Verify Worker Health

After starting/restarting, always verify:

```bash
# Wait for startup
sleep 3

# Check health
curl -s http://localhost:8000/health

# Check queue status
curl -s "http://localhost:8000/queue-status" -H "x-internal-token: luffy@10HDLBNndnv"
```

## Troubleshooting

### Worker Won't Start

1. Check if port 8000 is already in use: `lsof -i :8000`
2. Check worker logs for errors: `tail -50 /tmp/worker.log`
3. Verify Python dependencies: `source .venv/bin/activate && pip list`

### Worker Health Check Fails

1. Wait longer for startup (5-10 seconds)
2. Check if worker process is running: `ps aux | grep server.py`
3. Check logs for connection errors: `tail -100 /tmp/worker.log | grep -i error`

### Queue Status Shows Issues

1. Check MongoDB connection in worker logs
2. Verify environment variables are set correctly
3. Check if worker has necessary permissions

## Environment Requirements

- Python virtual environment at `.venv`
- MongoDB connection configured in `.env`
- Port 8000 available

## Files

- Worker code: `worker/server.py`
- Worker config: `worker/.env`
- Worker logs: `/tmp/worker.log`
