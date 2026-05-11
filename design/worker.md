# Worker Service

## Overview

The worker is a Python FastAPI service that handles image processing using AI models.

## Location
`worker/server.py` - Main FastAPI application

## AI Models

### BiRefNet
- **Location**: `worker/ZhengPeng7_BiRefNet_lite`
- **Use**: High-quality background removal
- **Model files**: Pre-downloaded in repository

### RMBG-1.4
- **Use**: Best quality background removal
- **Download**: From official source

### TensorFlow.js
- **Location**: Client-side in browser
- **Use**: Fast processing without server

## API Endpoints

### POST /process
Submit image for processing.

**Request**: Multipart form with image file
**Response**: Job ID

### GET /status/{job_id}
Get job status.

**Response**:
```json
{
  "status": "queued|running|completed|error",
  "progress": 0-100,
  "queue_position": 1,
  "estimated_wait_seconds": 60
}
```

### GET /result/{job_id}
Get processed image result.

**Response**: Binary image data (PNG)

## Environment Variables

Create `worker/.env` with:
```
MONGODB_URI=mongodb://...
WORKER_INTERNAL_TOKEN=secret
MODEL_PATH=./ZhengPeng7_BiRefNet_lite
```

## Running Worker

```bash
cd worker
pip install -r requirements.txt
python server.py
```

The worker listens on port 8000 by default.