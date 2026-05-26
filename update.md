# QuickBG — Product Update

## 1. Known Issues

### 1.1 Brush Lag on Canvas
- **Problem:** The eraser/brush tool on the canvas has noticeable lag during drawing.
- **Goal:** Brush strokes should render in real-time with no perceptible delay.
- **Notes:** Investigate canvas rendering pipeline — consider reducing `thinning`/`smoothing` values in perfect-freehand, using `requestAnimationFrame` more efficiently, or offloading stroke rendering to a Web Worker.

### 1.2 AI Over-Erasure Recovery
- **Problem:** When the AI incorrectly removes part of the image, it's very difficult for users to restore the removed area.
- **Goal:** Users should be able to easily restore accidentally removed regions.
- **Notes:** The eraser tool already has an "erase/restore" toggle, but the restore workflow may not be intuitive enough. Consider improving the restore brush UX or adding a one-click "undo AI removal" option.

### 1.3 Cursor Visibility on Edit Screen
- **Problem:** The circle cursor on the edit section doesn't follow the mouse properly. On mobile, users can't see what they're erasing.
- **Goal:** The brush cursor should accurately follow the pointer on both desktop and mobile.
- **Notes:** The `cursorPos` state exists in `eraser-tool.tsx` but may not be syncing correctly with touch events. Need to handle `touchmove` events and ensure the cursor overlay is visible on all screen sizes.

---

## 2. Design Changes

### 2.1 Admin Panel — Show User Data, Not Developer Data
- **Problem:** The current admin panel shows developer/internal data instead of real user usage data.
- **Goal:** Redesign the admin panel to reflect actual user activity and system health.
- **Data to display:**
  - Total registered users
  - Jobs: completed, failed, pending (counts + trends over time)
  - Uploads per user / total uploads
  - Tool usage breakdown (which tools are used most)
  - Error/failure rate
- **Notes:** The admin page at `website/src/app/admin/page.tsx` already has charts and stats components — update the API route at `website/src/app/api/admin/stats/route.ts` to return real user data instead of mock/internal data.

---

## 3. New Features

### 3.1 Sharpness Tool
- **Description:** Add a sharpness adjustment tool, similar to the existing BG Blur tool. Users must be able to choose whether to apply sharpness to the **background** or the **subject**.
- **Requirements:**
  - Toggle/selector to choose sharpness target: **Background** or **Subject**
  - Slider-based sharpness control (increase/decrease)
  - Real-time preview of the effect
  - Apply to the processed image
- **Notes:** A `/sharpness` page already exists in the project. Build out the actual sharpness adjustment logic (e.g., using canvas convolution or a library like CamanJS). The BG/Subject distinction is the key differentiator — the tool should use the existing subject mask/alpha channel to isolate where the sharpness is applied.

### 3.2 Post-Processing Rating System
- **Description:** After a tool finishes processing, show a small, non-intrusive rating widget so users can rate their experience.
- **Requirements:**
  - Appear after processing completes (not overlaid on the image)
  - Smooth animation on appear/dismiss
  - Rate per tool (e.g., 1–5 stars or thumbs up/down)
  - Store ratings for analytics — helps understand user satisfaction per tool
- **Notes:** Should be placed in a visible but unobtrusive area (e.g., bottom toolbar or a toast-style popup). Do NOT block the processed image.

### 3.3 Homepage Audit & Cleanup
- **Description:** Review the entire homepage and remove any unused, redundant, or unnecessary components. Add anything users might be missing.
- **Requirements:**
  - Audit all components on `website/src/app/page.tsx`
  - Remove dead code, unused imports, redundant UI elements
  - Identify any missing user-facing features (e.g., clear CTA, tool descriptions, etc.)
- **Notes:** Check for any components that are imported but never rendered.

### 3.4 Browser Tab Notification on Processing Complete
- **Description:** When image processing completes, show a visual indicator on the browser tab (favicon badge) so users can see results are ready even when the tab is not active.
- **Requirements:**
  - Detect when all queued images finish processing
  - Show a notification badge on the favicon (e.g., green dot or checkmark overlay)
  - Favicon returns to normal when user switches back to the tab (document becomes visible)
  - Optionally show a browser notification (with permission) for audible alert
  - Update the tab title to show count: e.g., `"✅ QuickBG — 3 images ready"`
- **Notes:** Pure client-side implementation. Swap favicon dynamically using a `<link rel="icon">` change. Use `document.visibilityState` to detect when user returns. No backend changes needed. This is critical for UX since processing can take a while and users often switch tabs while waiting.

---

## 4. Backend Exists — Needs Frontend Only

### 4.1 Watermark Tool
- **Description:** Let users add text watermarks to processed images before downloading.
- **Status:** Backend `addWatermark()` in `website/src/lib/image-processing.ts` already exists with full options (text, font, color, opacity, position).
- **Requirements:**
  - Add a watermark section to the remover/editor page or as a standalone tool
  - Text input for watermark content
  - Font size, color, opacity sliders
  - Position selector (top-left, top-right, bottom-left, bottom-right, center)
  - Live preview of watermark on image
  - Download watermarked image

### 4.2 Border / Frame Tool
- **Description:** Add colored borders/frames around images.
- **Status:** Backend `addBorder()` in `website/src/lib/image-processing.ts` already exists.
- **Requirements:**
  - Border width slider
  - Color picker
  - Preview the result
  - Standalone tool page or integrated into Adjust page

### 4.3 Format Converter
- **Description:** Convert images between PNG, JPG, WebP, AVIF, TIFF formats.
- **Status:** Backend `compressImage()` and `convertFormat()` already support all formats.
- **Requirements:**
  - Upload image → select target format → adjust quality → download
  - Brief description of each format (e.g., "JPG: smaller, no transparency")

---

## 5. Client-Side Features (No Backend Needed)

### 5.1 Copy Processed Image to Clipboard
- **Description:** One-click copy the processed result to clipboard for quick pasting into other apps.
- **Requirements:**
  - "Copy" button next to Download
  - Uses `navigator.clipboard.write()` with PNG blob
  - Toast notification confirming copy
  - Fallback for browsers that don't support clipboard API

### 5.2 Undo/History Panel for Adjust Tool
- **Description:** Let users step back through adjustment changes instead of resetting everything.
- **Requirements:**
  - Store each adjustment state in a stack (array of slider values)
  - Undo button (Ctrl+Z keyboard shortcut)
  - Redo button (Ctrl+Shift+Z)
  - Show history count

### 5.3 Image Info / Metadata Display
- **Description:** Show image metadata (dimensions, file size, format) on the editor page.
- **Requirements:**
  - Display in the info panel next to the image
  - Show original dimensions, processed dimensions, file size
  - Format/type badge

### 5.4 PWA / Install Prompt
- **Description:** Make QuickBG installable as a Progressive Web App.
- **Requirements:**
  - Add `manifest.json` with app name, icons, theme color
  - Register a service worker for caching
  - Show install banner on mobile
  - Offline page for when user has no connection

---

## 6. Small UX Improvements

### 6.1 Per-Image Progress Bar
- **Description:** Show individual progress indicators for each image in batch processing instead of one generic spinner.

### 6.2 Keyboard Shortcuts
- **Description:** Add keyboard shortcuts — Ctrl+Z (undo), Ctrl+S (download), arrow keys (navigate images), Esc (close modal).

### 6.3 Mobile Touch Improvements
- **Description:** Fix eraser cursor on touch devices, add pinch-to-zoom on preview, swipe between images in gallery.

---

## 7. Collections (Reference)
- Review existing collections in the codebase.
- Create new collections as needed based on the requirements above.
