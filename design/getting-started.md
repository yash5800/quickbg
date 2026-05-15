# Getting Started

## Prerequisites

- Node.js 18+ 
- Python 3.10+
- MongoDB instance
- Git

## Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd quickbg
```

### 2. Setup Worker (Python FastAPI)
```bash
cd worker
cp .env.local.example .env
# Edit .env with your MongoDB URI and other settings
pip install -r requirements.txt
python server.py
```

### 3. Setup Website (Next.js)
```bash
cd website
npm install
cp .env.local.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### 4. Access the app
Open http://localhost:3000 in your browser

## Key Configuration

### Environment Variables (Website)
- `NEXT_PUBLIC_WORKER_API_URL` - Worker API endpoint (e.g., http://localhost:8000)
- `NEXT_MONGODB_URI` - MongoDB connection string
- `WORKER_INTERNAL_TOKEN` - Secret token shared with worker
- `NEXT_PUBLIC_APP_URL` - Your app URL

### Environment Variables (Worker)
- `MONGODB_URI` - MongoDB connection string
- `WORKER_INTERNAL_TOKEN` - Same token as website

## Development

### Running both services
```bash
# Terminal 1: Worker
cd worker && python server.py

# Terminal 2: Website
cd website && npm run dev
```

### Making changes
- Frontend: Edit files in `website/src/`
- Backend: Edit `worker/server.py`

## Testing

Visit different routes:
- `/` - Home page
- `/remover` - Background removal
- `/admin` - Admin panel (requires login)
- `/batch` - Batch processing

## Common Issues

1. **CORS errors**: Check worker has CORS configured for your dev URL
2. **MongoDB connection**: Verify your MongoDB URI is correct
3. **Model not found**: Ensure BiRefNet model files are downloaded
4. **Credits not working**: Check `/api/admin/session` endpoint

## Architecture Overview

See [architecture.md](architecture.md) for system diagram.

## Key Files

- Frontend entry: `website/src/app/page.tsx`
- API routes: `website/src/app/api/`
- State stores: `website/src/store/`
- Worker: `worker/server.py`