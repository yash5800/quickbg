# QuickBG — Production Readiness Audit

_Generated from a full inspection of every page, shared component, store, and API route in `website/src`._

This document records the issues found while inspecting the site for the three goals in `update.md`:

1. Inspect every page and functionality.
2. Record the issues in a `.md` file at the root (this file).
3. Make the site smooth / production-ready, without delays.

Items marked **[FIXED]** were addressed in the same pass; the remainder are
recorded as a backlog with file:line references.

---

## 1. Credit system (the reported bug)

The reported symptoms — _"credits deduct more than they should; on reload it shows
the default 25 and only shows the true credit after uploading"_ — trace to two
concrete root causes.

### 1.1 Credits are never synced to the store on load **[FIXED]**
- `src/store/useCreditsSync.ts` fired a React Query against `getQueueStatus()`
  (which returns the authoritative `remaining` / `reset_in_seconds`) but **never
  applied the result to the credits store**. `setCredits` was only ever called
  from `ImageContext` during an upload/reservation.
- Result: on every reload the store sat at its hardcoded default (`remaining: 25`,
  `src/store/credits.ts:31`) until the first upload triggered `setCredits`, which
  then "snapped" to the real value — exactly the reported behaviour.
- **Fix:** `useCreditsSync` now writes `data.remaining` / `data.reset_in_seconds`
  into the store via `setCredits` whenever the query returns, so the badge shows
  the true balance immediately on load and refreshes on the 60s poll.

### 1.2 Reserved slots leaked on upload failure → over-deduction **[FIXED]**
- In `src/contexts/ImageContext.tsx` the auto-process effect called
  `reserveUploadSlot()` (which increments the server-side hourly count) but did
  **not** set `creditReserved = true` on the image.
- The error handler only releases a slot when `currentImage?.creditReserved` is
  truthy (`ImageContext.tsx:513`). Because the flag was never set, a failed upload
  **kept the reserved slot**, so the user was charged for uploads that never
  completed — "deducting more than it should."
- **Fix:** the image is marked `creditReserved: true` immediately after a
  successful reservation, so the existing release-on-failure path runs and the
  slot is returned.

### 1.3 Dead code (low)
- `consumeCredit()` in `src/store/credits.ts:52` is defined but never called.
  Credit math is server-authoritative via `setCredits`. Left in place (harmless);
  safe to remove later.

---

## 2. Performance / smoothness ("whole site feels laggy")

### 2.1 Floating credits badge re-rendered every second, always **[FIXED]**
- `FloatingCredits` (`src/components/client-layout.tsx`) ran a `setInterval(…, 1000)`
  whenever credits were initialized, re-rendering the badge once per second on
  **every page** even though the countdown is only displayed when credits are
  exhausted.
- **Fix:** the per-second timer now runs only while `isExhausted` is true.

### 2.2 Typewriter re-rendered the hero on every keystroke **[FIXED]**
- `src/components/typewriter.tsx` updates state every ~40–85ms during typing. It
  was not memoized, so it re-rendered with its parent.
- **Fix:** wrapped in `React.memo` so it re-renders in isolation.

### 2.3 Parallax ignored `prefers-reduced-motion` **[FIXED]**
- `src/components/parallax-showcase.tsx:48` called `useReducedMotion()` but
  discarded the result; all scroll-linked transforms (6 floating icons + content
  + stat cards) ran regardless, causing scroll jank on low-end/mobile and an
  accessibility violation.
- **Fix:** the heavy floating-icon and content transforms are disabled when the
  user prefers reduced motion (static fallback styles).

### 2.4 Tool carousel kept animating in background tabs **[FIXED]**
- `src/components/interactive-tool-playground.tsx:38` auto-rotated every 3.8s with
  no `document.hidden` check, burning CPU/battery in background tabs.
- **Fix:** the rotation pauses while the tab is hidden (`visibilitychange`).

### 2.5 Worker polling drives whole-tree re-renders (backlog, medium)
- `src/contexts/ImageContext.tsx:386` polls each active job every 2000ms and
  writes into the zustand image store, broadcasting to all subscribers
  (remover page, thumbnail gallery, preview). During batch processing this is the
  main source of stutter. Consider isolating progress into a dedicated store/slice
  or batching updates so unrelated components don't reconcile each tick.

### 2.6 Heavy libraries bundled eagerly (backlog, medium)
- `@tensorflow/tfjs` (`src/lib/client-model.ts`), `fabric`, `stackblur-canvas`
  (`src/app/blur-bg/page.tsx`), `perfect-freehand` (`src/components/eraser-tool.tsx`),
  and `recharts` (`src/app/admin/page.tsx`) are imported at module scope. They
  should be `dynamic()`/lazy-imported so users who never open those tools don't
  pay the download. TensorFlow alone is ~500KB.

### 2.7 Large client pages (backlog, medium)
- `src/app/page.tsx` (~1000 lines) and `src/app/adjust/page.tsx` (~650 lines) are
  single `"use client"` blobs. Splitting static sections (FAQ, testimonials) into
  server components / lazy chunks would cut initial JS and improve FCP.

### 2.8 `next.config.js` image/format tuning (backlog, low)
- No explicit `images.formats` (avif/webp) or `deviceSizes`. Next 14 defaults are
  reasonable but explicit AVIF/WebP improves delivery.

---

## 3. Animations / polish ("entire site needs animations like a Next.js site")

### 3.1 Only the home & remover pages were animated; all others popped in **[FIXED globally]**
- 20 of 22 routes (all tool pages, all content/legal pages, admin) had **no**
  entrance or transition animation, while the home page is heavily animated — a
  stark, immediately visible inconsistency.
- **Fix:** added a reduced-motion-aware page-entrance transition in
  `src/components/client-layout.tsx`, keyed on the pathname, so **every** route
  now fades/rises in smoothly on navigation without per-page edits and without
  the risk of app-router exit-animation hacks.

### 3.2 Stray `console.log` in production path **[FIXED]**
- `src/app/blur-bg/page.tsx:92,98` left debug `console.log`s in the render path.
  Removed.

### 3.3 Backlog — per-page polish (not yet done)
- Hardcoded English strings bypassing `t()` in `src/app/adjust/page.tsx`
  (e.g. "Processed", "Image Adjustments", "Preview updates automatically…").
- Missing `aria-label`s on tool controls (sliders/color pickers) across
  `adjust`, `crop`, `resize`, `replace-bg`.
- No loading skeletons / reserved space on tool preview areas (`adjust`,
  `blur-bg`, `replace-bg`) → minor CLS when results appear.
- No React error boundaries; a thrown component shows the Next error overlay
  instead of graceful UI.
- Mobile menu (`client-layout.tsx`) uses a Tailwind enter animation with no exit
  animation.

---

## 4. Summary of changes applied in this pass

| Area | File | Change |
|------|------|--------|
| Credit sync | `src/store/useCreditsSync.ts` | Apply queue-status to credits store on load + poll |
| Credit leak | `src/contexts/ImageContext.tsx` | Mark `creditReserved` after reserve so failures release |
| Perf | `src/components/client-layout.tsx` | Countdown timer only runs when exhausted |
| Perf | `src/components/typewriter.tsx` | `React.memo` |
| Perf / a11y | `src/components/parallax-showcase.tsx` | Honour `prefers-reduced-motion` |
| Perf | `src/components/interactive-tool-playground.tsx` | Pause carousel on hidden tab |
| Animation | `src/components/client-layout.tsx` | Global page-entrance transition |
| Cleanup | `src/app/blur-bg/page.tsx` | Remove debug logs |

The backlog items in §2.5–2.8 and §3.3 are larger refactors recorded here for a
follow-up pass; none are blocking and none were changed to avoid risk of breakage.

---

## 5. Round 2 — hydration error + remover redesign

### 5.1 Hydration mismatch on the home page **[FIXED]**
- **Root cause:** framer-motion's `useReducedMotion()` reads the media query
  synchronously in its `useState` initializer — it returns `null` on the server
  but the real value on the client's first render. The `PageTransition` added in
  §3.1 branched its **DOM structure** on that value (`<>{children}</>` vs a
  `<motion.div>` wrapper), so on a reduced-motion device the server and client
  rendered different trees → "Hydration failed because the initial UI does not
  match." `parallax-showcase.tsx` had the same render-time branch on inline style.
- **Fixes:**
  - New SSR-safe hook `src/hooks/use-reduced-motion-safe.ts` reports `false`
    until after mount, so server and first client render always agree.
  - `PageTransition` no longer branches structure; the whole tree is wrapped in
    `<MotionConfig reducedMotion="user">`, which disables the slide for
    reduced-motion users while keeping identical markup.
  - `parallax-showcase.tsx` now uses the SSR-safe hook.
  - The Google AdSense tag was moved from a raw `<script async>` in `<head>` to
    `next/script` with `strategy="lazyOnload"` (`src/app/layout.tsx`), so it can
    no longer inject DOM during hydration (a secondary mismatch source) and it
    no longer blocks first paint.

### 5.2 Remover page — focused polish + watermark visibility **[FIXED]**
- **Watermark wasn't visible properly** (`src/components/preview-info.tsx`):
  - The live preview rendered the transparent PNG on a near-invisible
    `bg-muted/40`; the white watermark text had no contrast outline. It now sits
    on a `.checkerboard` surface and the overlay text has a dual `textShadow`
    outline so any colour stays legible on light or dark areas of the cutout.
  - The "jump to watermark" hint button had broken positioning
    (`right-6` + `-translate-x-1/2`); it's now a clean, prominent primary pill.
  - The watermark/border controls were a flat bordered box; they're now a
    `premium-surface` card with icon headings (`Stamp` / `SquareDashedBottom`),
    `.premium-slider` ranges, value read-outs, aria-labels, and a spinner on apply.
- **Empty-state drop zone** (`src/app/remover/page.tsx`): refined hierarchy —
  animated upload affordance, explicit upload button, and supported-format chips.
- **Active header**: the credits read-out is now a colour-coded pill (primary /
  amber / destructive by remaining balance) instead of plain amber text.
- Layout and the processing pipeline were intentionally left unchanged
  (focused-polish scope), so nothing in the upload→process→download flow moved.
