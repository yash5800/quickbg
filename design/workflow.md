# Workflow

## Image Processing Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│   Queue     │────▶│ Processing  │────▶│   Result    │
│   Image     │     │   (MongoDB) │     │ (BiRefNet)  │     │   Display   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Step-by-Step Process

### 1. Image Upload
- User selects image via drop zone or file picker
- Image is validated (type, size)
- Preview is generated
- Image is added to store

### 2. Submit for Processing
- User clicks process button
- Frontend calls `/api/remove-background` with image data
- Job is created in MongoDB with status "queued"
- Job ID is stored in image state

### 3. Status Polling
- Frontend polls `/api/status/[jobId]` periodically
- Status updates: queued → running → completed/error
- Progress percentage is displayed
- Queue position shown when queued

### 4. Result Retrieval
- On "completed" status, fetch result from `/api/result/[jobId]`
- Convert blob to object URL
- Update image state with result
- Display to user

### 5. Credits Deduction
- Credits are deducted after successful processing
- Credits sync with server via `/api/admin/session`

## Client-Side Processing (Fast Model)
- Uses TensorFlow.js
- Processes directly in browser
- No server round-trip
- Immediate results for simple images

## Server-Side Processing (Quality/Best Models)
- Image sent to Worker API
- Job queued in MongoDB
- BiRefNet or RMBG-1.4 model processes image
- Result returned and displayed