# Website

Next.js 14 frontend for QuickBG - AI-powered background removal.

---

## Overview

This is the public-facing web interface. It handles:
- Image uploads via drag & drop
- Client-side AI processing (TensorFlow.js)
- Direct browser-to-worker processing for uploads
- Image editing tools (brightness, contrast, eraser)
- Admin panel for analytics and job management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State**: React Context
- **Icons**: Lucide React
- **AI**: TensorFlow.js (client), Worker API (server)

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── api/               # API routes
│   │   ├── admin/        # Admin API (analytics, cleanup, login)
│   │   └── status/       # Job status polling
│   ├── admin/           # Admin dashboard
│   ├── adjust/          # Image adjustment tool
│   ├── blur-bg/         # Blur background tool
│   ├── crop/             # Crop tool
│   ├── enhance/         # Enhancement tool
│   ├── page.tsx          # Home/upload page
│   ├── remover/          # Main background removal
│   ├── replace-bg/       # Replace background tool
│   ├── resize/           # Resize tool
│   └── tools/            # Tools landing page
├── components/           # UI components
│   ├── ui/              # Shadcn-style components
│   └── *.tsx           # Feature components
├── contexts/            # React contexts (ImageContext)
└── lib/                 # Utilities
    ├── admin-auth.ts    # Admin authentication
    ├── client-model.ts  # Client-side TF.js model
    ├── worker-api.ts    # Worker API client
    └── utils.ts         # General utilities
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home - upload images, select processing mode |
| `/remover` | Main background removal interface |
| `/adjust` | Adjust brightness, contrast, saturation |
| `/blur-bg` | Blur image backgrounds |
| `/crop` | Crop images |
| `/enhance` | Enhance image quality |
| `/replace-bg` | Replace background with color/image |
| `/resize` | Resize images |
| `/admin` | Admin dashboard (protected) |

## API Routes

### Admin API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/login` | POST | Admin login |
| `/api/admin/logout` | POST | Admin logout |
| `/api/admin/stats` | GET | System statistics |
| `/api/admin/recent-jobs` | GET | Recent jobs list |
| `/api/admin/analytics` | GET | Analytics data |
| `/api/admin/cleanup` | POST | Trigger cleanup |
| `/api/admin/delete-all-data` | DELETE | Delete all data |

### Status API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status/{job_id}` | GET | Poll job status |

## Environment Variables

```bash
# Worker API (required for direct uploads and status/result polling)
NEXT_PUBLIC_WORKER_API_URL=http://localhost:8000

# MongoDB (required for persistence)
NEXT_MONGODB_URI=mongodb://...
NEXT_MONGODB_DB=testbgremover

# Internal token for worker communication from server-side routes only
WORKER_INTERNAL_TOKEN=your-secret-token
```

## Build

```bash
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Lint code
```

## Admin Panel

Access at `/admin` - requires login with `ADMIN_PASSWORD` environment variable.

Features:
- Live job statistics
- Recent jobs with status
- Analytics charts (jobs, unique users over time)
- Manual cleanup trigger
- Delete all data (with confirmation)
