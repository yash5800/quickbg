# Worker

Python FastAPI service for AI-powered background removal. Handles heavy processing with BiRefNet model.

---

## Overview

This service processes images asynchronously using the BiRefNet model:

- Accepts image uploads via REST API
- Queues jobs in MongoDB
- Processes images with BiRefNet segmentation
- Supports SSE events for real-time progress
- Auto-cleans old jobs

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.10+
- **AI**: PyTorch, Transformers (BiRefNet)
- **Database**: MongoDB
- **Server**: Uvicorn

## Getting Started

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.local.example .env
# Edit .env with your values
```

### 3. Download Model (Optional)

The model downloads automatically on first run. To download manually:

```bash
python download_models.py
```

### 4. Run Server

```bash
python server.py
```

The server runs on port 8000 by default (configurable via `PORT` env var).

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/remove` | POST | Submit image for processing |
| `/status/{job_id}` | GET | Get job status |
| `/result/{job_id}` | GET | Download processed image |
| `/queue-status` | GET | Get queue statistics |
| `/events/{job_id}` | GET | SSE event stream for job progress |
| `/health` | GET | Health check |

### Remove Image

```bash
curl -X POST http://localhost:8000/remove \
  -H "x-internal-token: your-token" \
  -F "file=@image.jpg"
```

### Check Status

```bash
curl http://localhost:8000/status/{job_id}
```

### Get Result

```bash
curl -O http://localhost:8000/result/{job_id}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_MONGODB_URI` | required | MongoDB connection string |
| `NEXT_MONGODB_DB` | `bgremover` | Database name |
| `WORKER_INTERNAL_TOKEN` | none | Token for API authentication |
| `WORKER_MAX_UPLOAD_SIZE_BYTES` | `10485760` | Max file size (10MB) |
| `WORKER_MAX_CONCURRENCY` | `2` | Max parallel jobs |
| `WORKER_MAX_JOBS_PER_CLIENT` | `1` | Max jobs per client |
| `WORKER_JOB_RETENTION_HOURS` | `24` | Hours to keep completed jobs |
| `WORKER_CORS_ORIGINS` | `localhost:3000` | Allowed CORS origins |
| `WORKER_MODEL_REPO_ID` | `Joker5800/ZhengPeng7_BiRefNet_lite` | HuggingFace model repo |
| `HF_TOKEN` | none | HuggingFace API token |

## Architecture

```
┌─────────────┐
│   Website   │──── POST /remove
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   /remove       │──► Save file → Create job in MongoDB
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Dispatcher      │──► Claim queued job → Update status
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  process_job()  │──► Load image → Run BiRefNet → Save output
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  SSE Events      │──► Broadcast status to subscribed clients
└─────────────────┘
```

## Concurrency

Dynamic concurrency based on system resources:

- **High load** (CPU > 80% or Memory > 80%): 1 job
- **Low load** (CPU < 40% and Memory < 40%): up to 2 jobs
- **Default**: 1 job

## Cleanup

Old jobs are automatically cleaned up:

- Runs every 30 minutes (configurable)
- Removes completed/failed jobs older than 24 hours
- Deletes associated files from disk

## Deployment

See [DEPLOY_GCP.md](DEPLOY_GCP.md) for Google Cloud Run deployment.

### Docker

```bash
docker build -t bgremover-worker .
docker run -p 8000:8080 --env-file .env bgremover-worker
```

## License

MIT
