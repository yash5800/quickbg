# TypeScript Types

## Core Types

### ImageItem (`types/image.ts`)
Represents a single image in the processing queue (frontend state).

```typescript
interface ImageItem {
  id: string;
  file: File;
  name: string;
  preview: string;
  status: ImageStatus;
  jobId: string | null;
  result: string | null;
  progress: number;                 // Derived from job status
  startTime: number | null;
  duration: number | null;
  error: string | null;
  queuePosition: number | null;    // Computed on-demand
  estimatedWaitSeconds: number | null;  // Computed on-demand
}

type ImageStatus = 
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'error';
```

**Note:** Frontend still calculates progress locally using `getProgressFromStatus(job.status)`. See [PROGRESS_DERIVATION.md](PROGRESS_DERIVATION.md).

### Job (`types/job.ts`)
Represents a processing job in the database.

```typescript
interface Job {
  _id: string;
  jobId: string;                    // Unique job identifier
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: Date;                  // Creation timestamp
  updatedAt: Date;                  // Last modification timestamp
  expiresAt: Date;                  // Auto-deletion timestamp (10 minutes)
  fileName: string;
  sessionId: string;
  resultPath?: string;              // Path to processed result
  error?: string;
  // Note: progress field NOT stored - derive from status via getProgressFromStatus()
}
```

**Removed fields (May 2026 optimization):**
- ❌ `progress` - Now derived from `status`
- ❌ `completed_at` - Inferred from `status: "completed"`
- ❌ `queuePosition` - Computed on-demand
- ❌ `estimatedWait` - Calculated from queue position

See [OPTIMIZATION.md](OPTIMIZATION.md) for details.

### Index Types (`types/index.ts`)
Exports all types for convenient importing.

## Usage

Import types from `@/types`:
```typescript
import { ImageItem, Job } from '@/types';
```