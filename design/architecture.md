# Architecture Overview

## System Diagram

```
┌──────────────┐         ┌──────────────┐
│   Browser    │──POST──▶│   Website    │
│  (Next.js)   │◀──JSON──│  (Next.js)   │
└──────────────┘         └──────┬───────┘
                                │ internal call
                                ▼
                         ┌──────────────┐
                         │   Worker     │
                         │ (FastAPI)    │
                         │ + BiRefNet   │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   MongoDB    │
                         │ (job queue)  │
                         └──────────────┘
```

## Tech Stack

### Frontend (website/)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18, Tailwind CSS, Framer Motion
- **State**: Zustand (stores), React Context
- **Styling**: Tailwind CSS with custom theme

### Backend (worker/)
- **Framework**: FastAPI (Python)
- **AI Models**: BiRefNet, RMBG-1.4, TensorFlow.js
- **Database**: MongoDB (job queue)
- **Runtime**: Python 3.10+

## Component Responsibilities

### Website (Next.js)
- Serves UI pages and routes
- Handles user authentication (admin)
- Manages image upload and preview
- Coordinates with worker API
- Manages credits system

### Worker (FastAPI)
- Processes images using AI models
- Manages job queue in MongoDB
- Returns processed results
- Handles model loading and inference

## Data Flow

1. User uploads image via Next.js frontend
2. Frontend calls `/api/remove-background` endpoint
3. Next.js forwards request to Worker API
4. Worker creates job in MongoDB queue
5. Worker processes image with BiRefNet/RMBG
6. Frontend polls for job status
7. Completed result is retrieved and displayed

## Directory Structure

```
quickbg/
├── website/src/
│   ├── app/           Next.js pages (app router)
│   ├── components/    React components
│   ├── contexts/     React context providers
│   ├── store/        Zustand stores
│   ├── types/        TypeScript definitions
│   ├── lib/          Utilities and API clients
│   ├── hooks/        Custom React hooks
│   └── views/        View components
├── worker/           Python FastAPI service
└── design/           Documentation files
```