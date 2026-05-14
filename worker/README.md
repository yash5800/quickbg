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
| `HF_TOKEN` | Yes | HuggingFace API token |
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

## Local Development

```bash
pip install -r requirements.txt
cp .env.local.example .env  # Edit with your values
python server.py
```

## Deployment

This Space is configured to build and deploy automatically via HuggingFace Spaces using `Dockerfile.hf`.