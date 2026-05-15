# State Management

## Overview

The project uses a combination of:
- **Zustand** - Global state management for images, credits, processing
- **React Context** - ImageContext for image operations
- **React State** - Local component state

## Zustand Stores

### Images Store (`store/images.ts`)
Manages the list of uploaded/processed images.

```typescript
interface ImagesStore {
  images: ImageItem[];
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  updateImageStatus: (id: string, status: string, data?: Partial<ImageItem>) => void;
  updateImage: (id: string, data: Partial<ImageItem>) => void;
  updateImageResult: (id: string, result: string) => void;
}
```

### Credits Store (`store/credits.ts`)
Manages user credits.

```typescript
interface CreditsStore {
  credits: number;
  setCredits: (credits: number) => void;
  decrementCredits: (amount: number) => void;
}
```

### Processing Store (`store/processing.ts`)
Tracks current processing state.

```typescript
interface ProcessingStore {
  currentImageId: string | null;
  isSubmitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  clearSubmitting: () => void;
}
```

### Credits Sync (`store/useCreditsSync.ts`)
Synchronizes credits with server.

## React Context

### ImageContext (`contexts/ImageContext.tsx`)
Provides image manipulation functions to child components.
- `addImages()` - Add files to processing queue
- `removeImage()` - Remove image from queue
- `updateImageStatus()` - Update processing status
- `updateImageResult()` - Set processed result

## State Flow

1. User uploads image → `addImages()` adds to store
2. User submits → `processingStore` sets submitting state
3. Image submitted → status set to "queued"
4. Polling updates status → `imagesStore` updates
5. Processing complete → result stored in `imagesStore`
6. Credits deducted → `creditsStore` updates