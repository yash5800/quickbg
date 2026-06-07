---
title: QuickBG Worker
emoji: 🖼️
colorFrom: blue
colorTo: purple
sdk: docker
dockerfile: Dockerfile.hf
pinned: false
---

# QuickBG Worker

Python FastAPI service for AI-powered background removal. Handles heavy processing with BiRefNet model.

## Overview

This service processes images asynchronously using the BiRefNet model:

- Accepts image uploads via REST API
- Queues jobs in MongoDB
- Processes images with BiRefNet segmentation
- Supports SSE events for real-time progress
- Auto-cleans old jobs

## Environment Variables (set in Space secrets)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_MONGODB_URI` | Yes | MongoDB connection string |
| `WORKER_INTERNAL_TOKEN` | Yes | Token for internal API auth |
| `WORKER_CORS_ORIGINS` | Yes | Allowed browser origins for direct uploads |
| `HF_TOKEN` | Yes | HuggingFace API token |
| `WORKER_MAX_UPLOAD_SIZE_BYTES` | No | Default: 20 MB upload limit |
| `WORKER_MAX_CONCURRENCY` | No | Default: 1 (for limited RAM) |
| `ADMIN_CLEANUP_TOKEN` | No | Token for admin cleanup endpoint |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/remove` | POST | Submit image for processing |
| `/status/{job_id}` | GET | Get job status |
| `/result/{job_id}` | GET | Download processed image |
| `/events/{job_id}` | GET | SSE event stream |
| `/health` | GET | Health check |

## Architecture

```
Client → /remove → MongoDB (queue) → Worker picks up → BiRefNet → Save result
                                ↓
                         SSE events ← Client polls status
```

For browser-direct uploads from the public website, the request is accepted when the
`Origin` header matches one of the configured `WORKER_CORS_ORIGINS` values. Keep
`WORKER_INTERNAL_TOKEN` for server-to-server calls, but browser uploads do not need
to send it. The worker enforces a 20 MB default upload limit unless
`WORKER_MAX_UPLOAD_SIZE_BYTES` is overridden.

## Local Development

```bash
pip install -r requirements.txt
cp .env.local.example .env  # Edit with your values
python server.py
```

## Deployment

This Space is configured to build and deploy automatically via HuggingFace Spaces using `Dockerfile.hf`.