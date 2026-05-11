# QuickBG

AI-powered background removal for images. Fast, simple, and free.

---

## Project Structure

```
quickbg/
├── website/          Next.js frontend (this repo)
└── worker/           Python FastAPI worker (separate service)
```

## Architecture

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

## Components

| Component | Purpose |
|-----------|---------|
| **website** | Next.js 14 frontend with client-side & server-side AI processing |
| **worker** | Python FastAPI service running BiRefNet model for heavy processing |

## Quick Start

### 1. Setup Worker

```bash
cd worker
cp .env.local.example .env
# Configure .env with your values
pip install -r requirements.txt
python server.py
```

### 2. Setup Website

```bash
cd website
cp .env.local.example .env.local
# Configure .env.local with your values
npm install
npm run dev
```

---

## AI Models

| Model | Location | Best For |
|-------|----------|----------|
| **Fast** | Client-side (TensorFlow.js) | Quick edits, simple images |
| **Quality** | Server worker (BiRefNet) | Detailed recovery |
| **Best** | Server worker (RMBG-1.4) | Professional results |

## Tech Stack

**Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion

**Worker**: Python 3.10+, FastAPI, PyTorch, Transformers, MongoDB

**AI**: BiRefNet, TensorFlow.js, RMBG-1.4

## Environment Variables

See `.env.local.example` in each directory for required variables.

Key variables:
- `NEXT_PUBLIC_WORKER_API_URL` - Worker API endpoint
- `NEXT_MONGODB_URI` - MongoDB connection string
- `WORKER_INTERNAL_TOKEN` - Shared secret between services

## Deployment

- **Website**: Vercel, Render, or any Node.js hosting
- **Worker**: Docker to Google Cloud Run (see [worker/DEPLOY_GCP.md](worker/DEPLOY_GCP.md))

## License

MIT
