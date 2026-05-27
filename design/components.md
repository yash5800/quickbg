# Components

## Core Components

### Layout Components
- **app-layout.tsx** - Main app layout wrapper
- **client-layout.tsx** - Client-side layout with providers
- **theme-provider.tsx** - Theme context provider

### Navigation
- **header.tsx** - Top navigation bar with links and credits display

### Image Display
- **preview-display.tsx** - Main image preview area
- **preview-info.tsx** - Image details and metadata display
- **thumbnail-gallery.tsx** - Grid of image thumbnails

### Tools
- **eraser-tool.tsx** - Brush tool to erase parts of image
- **comparison-slider.tsx** - Before/after comparison slider

### Upload
- **global-drop-zone.tsx** - Drag and drop file upload area

### Feedback
- **feedback-section.tsx** - User feedback component

### UI (Subdirectory)
- Contains reusable UI primitives (buttons, inputs, etc.)

## Component Hierarchy

```
ClientLayout
├── Header
├── Page Content
│   ├── GlobalDropZone
│   ├── PreviewDisplay
│   │   ├── ComparisonSlider
│   │   └── EraserTool
│   ├── PreviewInfo
│   └── ThumbnailGallery
└── FeedbackSection
```

## Key Props

### PreviewDisplay
- `src` - Image source URL
- `result` - Processed result URL (optional)
- `onCompare` - Toggle comparison mode

### EraserTool
- `imageData` - Current image data
- `onUpdate` - Callback when eraser modifies image

### ComparisonSlider
- `before` - Original image
- `after` - Processed image
- `initialPosition` - Initial slider position (0-100)