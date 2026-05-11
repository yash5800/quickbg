# TypeScript Types

## Core Types

### ImageItem (`types/image.ts`)
Represents a single image in the processing queue.

```typescript
interface ImageItem {
  id: string;
  file: File;
  name: string;
  preview: string;
  status: ImageStatus;
  jobId: string | null;
  result: string | null;
  progress: number;
  startTime: number | null;
  duration: number | null;
  error: string | null;
  queuePosition: number | null;
  estimatedWaitSeconds: number | null;
}

type ImageStatus = 
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'error';
```

### Job (`types/job.ts`)
Represents a processing job.

```typescript
interface Job {
  _id: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress: number;
  created_at: string;
  completed_at?: string;
  error?: string;
}
```

### Index Types (`types/index.ts`)
Exports all types for convenient importing.

## Usage

Import types from `@/types`:
```typescript
import { ImageItem, Job } from '@/types';
```