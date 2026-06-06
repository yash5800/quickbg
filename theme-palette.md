# QuickBG Theme Palette

## Light Theme (`:root`)

| Variable | Value | Description |
|---|---|---|
| `--background` | `0 0% 100%` | Pure white surface |
| `--foreground` | `224 20% 14%` | Deep charcoal-slate text |
| `--card` | `0 0% 97%` | Subtle off-white card |
| `--card-foreground` | `224 20% 14%` | Card text |
| `--popover` | `0 0% 100%` | Popover surface |
| `--popover-foreground` | `224 20% 14%` | Popover text |
| `--primary` | `224 72% 50%` | Rich blue — CTAs, buttons, key links |
| `--primary-foreground` | `0 0% 100%` | Text on primary |
| `--secondary` | `163 68% 42%` | Premium emerald — links, badges, highlights |
| `--secondary-foreground` | `0 0% 100%` | Text on secondary |
| `--muted` | `224 12% 94%` | Soft neutral surface |
| `--muted-foreground` | `224 10% 52%` | Secondary text |
| `--accent` | `224 70% 96%` | Light blue-tint highlight |
| `--accent-foreground` | `224 20% 14%` | Text on accent |
| `--destructive` | `0 75% 55%` | Red for errors |
| `--destructive-foreground` | `0 0% 100%` | Text on destructive |
| `--border` | `224 12% 86%` | Light border |
| `--input` | `224 12% 90%` | Input field |
| `--ring` | `224 72% 50%` | Focus ring |

## Dark Theme (`.dark`)

| Variable | Value | Description |
|---|---|---|
| `--background` | `224 28% 7%` | Deep midnight surface |
| `--foreground` | `40 8% 92%` | Warm off-white text |
| `--card` | `224 24% 11%` | Slightly lifted card |
| `--card-foreground` | `40 8% 92%` | Card text |
| `--popover` | `224 24% 9%` | Popover surface |
| `--popover-foreground` | `40 8% 92%` | Popover text |
| `--primary` | `224 72% 55%` | Bright blue — CTAs, buttons, key links |
| `--primary-foreground` | `0 0% 100%` | Text on primary |
| `--secondary` | `163 60% 46%` | Refined emerald — links, badges, highlights |
| `--secondary-foreground` | `0 0% 100%` | Text on secondary |
| `--muted` | `224 18% 15%` | Dark neutral surface |
| `--muted-foreground` | `224 10% 60%` | Secondary text |
| `--accent` | `224 20% 20%` | Subtle highlight |
| `--accent-foreground` | `40 8% 92%` | Text on accent |
| `--destructive` | `0 60% 42%` | Dark red for errors |
| `--destructive-foreground` | `0 0% 100%` | Text on destructive |
| `--border` | `224 16% 20%` | Subtle border |
| `--input` | `224 16% 16%` | Input field |
| `--ring` | `224 72% 55%` | Focus ring |

## Usage Rules

### Tailwind semantic classes (from `tailwind.config.ts`)
| Class | Maps to | Use for |
|---|---|---|
| `bg-background` / `text-foreground` | Page body | Main background/text |
| `bg-card` / `text-card-foreground` | Cards, panels | Elevated surfaces |
| `bg-primary` / `text-primary` | Blue | CTAs, buttons, active states |
| `bg-secondary` / `text-secondary` | Emerald | Links, badges, highlights, labels |
| `bg-muted` / `text-muted-foreground` | Subtle | Secondary text, subtle backgrounds |
| `border-border` | Default | All borders |
| `text-destructive` | Red | Error states |
| `text-primary` | Blue | Form labels, info badges |
| `text-secondary` | Emerald | Links, success states, decorative accents |

### What was removed
All these hardcoded Tailwind colors were replaced with `primary` or `secondary`:
- ~~`lime-*`~~ → `secondary`
- ~~`emerald-*`~~ → `secondary`
- ~~`sky-*`~~ → `secondary`
- ~~`amber-*`~~ → `secondary`
- ~~`rose-*`~~ → `primary`
- ~~`cyan-*`~~ → `primary`
- ~~`violet-*`~~ → `primary`
- ~~`indigo-*`~~ → `primary`
- ~~`pink-*`~~ → `primary`
- ~~`blue-*`~~ → `primary`

### Exceptions (semantic, kept as-is)
- `text-red-*` — error/failure states (already mapped to destructive where applicable)
- Status indicator colors (job processing states, upload progress)
