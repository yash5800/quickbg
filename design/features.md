# Features

## Core Features

### Background Removal
- **Remover** (`/remover`) - Remove background from images
- **Blur Background** (`/blur-bg`) - Blur the background while keeping subject sharp
- **Replace Background** (`/replace-bg`) - Replace background with custom color/image

### Image Editing
- **Adjust** (`/adjust`) - Adjust brightness, contrast, saturation
- **Crop** (`/crop`) - Crop images to specific dimensions
- **Resize** (`/resize`) - Resize images to desired dimensions
- **Enhance** (`/enhance`) - Enhance image quality

### Batch Processing
- **Batch** (`/batch`) - Process multiple images at once

### Tools
- **Tools** (`/tools`) - Collection of image processing tools
- **Eraser Tool** - Remove specific areas from processed images
- **Comparison Slider** - Compare before/after results
- **Thumbnail Gallery** - View all uploaded/processed images

## Admin Features
- **Admin Panel** (`/admin`) - Dashboard with analytics
- **Login** (`/admin/login`) - Admin authentication
- **Analytics** - Usage statistics and metrics
- **Auto-Cleanup** - Jobs auto-deleted after 10 minutes via MongoDB TTL + worker file cleanup
- **Stats** - System performance metrics

## User Features
- **Credits System** - Track user credits
- **Global Drop Zone** - Drag and drop file upload
- **Progress Tracking** - Real-time job progress (derived from status, not stored)
- **Queue Status** - View position in processing queue

## AI Models

| Model | Location | Best For |
|-------|----------|----------|
| **Fast** | Client-side (TensorFlow.js) | Quick edits, simple images |
| **Quality** | Server worker (BiRefNet) | Detailed recovery |
| **Best** | Server worker (RMBG-1.4) | Professional results |