# Pages & Routes

## Main Pages

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `page.tsx` | Home page - main entry point |
| `/blur-bg` | `blur-bg/page.tsx` | Blur background tool |
| `/remover` | `remover/page.tsx` | Remove background tool |
| `/replace-bg` | `replace-bg/page.tsx` | Replace background tool |
| `/adjust` | `adjust/page.tsx` | Image adjustment tool |
| `/crop` | `crop/page.tsx` | Image cropping tool |
| `/resize` | `resize/page.tsx` | Image resize tool |
| `/enhance` | `enhance/page.tsx` | Image enhancement tool |
| `/batch` | `batch/page.tsx` | Batch processing |
| `/tools` | `tools/page.tsx` | Tools collection |

## Admin Pages

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | `admin/page.tsx` | Admin dashboard with analytics |
| `/admin/login` | `admin/login/page.tsx` | Admin login page |

## Layouts

- `app/layout.tsx` - Root layout
- `components/app-layout.tsx` - App shell layout
- `components/client-layout.tsx` - Client-side layout wrapper
- `components/header.tsx` - Header navigation

## API Routes (Next.js API)

See [api-routes.md](api-routes.md) for complete API documentation.