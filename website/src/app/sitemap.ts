import type { MetadataRoute } from 'next'

const baseUrl = 'https://quickbg.dev'

interface PageEntry {
  path: string
  priority: number
}

const pages: PageEntry[] = [
  { path: '', priority: 1 },
  { path: '/about', priority: 0.8 },
  { path: '/tools', priority: 0.9 },
  { path: '/remover', priority: 0.9 },
  { path: '/replace-bg', priority: 0.7 },
  { path: '/blur-bg', priority: 0.7 },
  { path: '/resize', priority: 0.7 },
  { path: '/crop', priority: 0.7 },
  { path: '/adjust', priority: 0.7 },
  { path: '/sharpness', priority: 0.7 },
  { path: '/converter', priority: 0.7 },
  { path: '/faq', priority: 0.8 },
  { path: '/blog', priority: 0.8 },
  { path: '/comparison', priority: 0.7 },
  { path: '/privacy', priority: 0.4 },
  { path: '/terms', priority: 0.4 },
  { path: '/legal', priority: 0.4 },
  { path: '/contact', priority: 0.5 },
  { path: '/blog/how-ai-background-removal-works', priority: 0.6 },
  { path: '/blog/transparent-pngs-amazon-etsy', priority: 0.6 },
  { path: '/blog/ecommerce-product-photos-guide', priority: 0.6 },
  { path: '/blog/best-free-image-editing-workflow', priority: 0.6 },
  { path: '/blog/common-mistakes-ai-background-removal', priority: 0.6 },
  { path: '/blog/how-to-resize-images-without-losing-quality-batch-processing-guide', priority: 0.6 },
  { path: '/blog/color-correction-101-adjusting-brightness-contrast-saturation', priority: 0.6 },
  { path: '/blog/image-sharpening-techniques-when-and-how-to-sharpen-photos', priority: 0.6 },
  { path: '/blog/complete-guide-to-cropping-rule-of-thirds-aspect-ratios-framing', priority: 0.6 },
  { path: '/blog/blur-effects-in-photography-background-vs-gaussian-vs-motion-blur', priority: 0.6 },
  { path: '/blog/how-to-create-amazon-approved-product-images-with-ai', priority: 0.6 },
  { path: '/blog/etsy-shop-optimization-role-of-image-quality-in-conversion', priority: 0.6 },
  { path: '/blog/diy-product-photography-professional-results-without-studio', priority: 0.6 },
  { path: '/blog/amazon-a-plus-content-transparent-cutouts-premium-listings', priority: 0.6 },
  { path: '/blog/multi-platform-selling-resizing-formatting-images-every-marketplace', priority: 0.6 },
  { path: '/blog/understanding-image-segmentation-semantic-vs-instance-vs-panoptic', priority: 0.6 },
  { path: '/blog/evolution-of-background-removal-chroma-key-to-deep-learning', priority: 0.6 },
  { path: '/blog/birefnet-vs-u2net-vs-modnet-comparing-ai-matting-models', priority: 0.6 },
  { path: '/blog/what-is-alpha-matte-and-why-it-matters-for-transparent-pngs', priority: 0.6 },
  { path: '/blog/science-of-image-resolution-dpi-ppi-and-why-size-matters', priority: 0.6 },
  { path: '/blog/quickbg-vs-removebg-which-background-removal-tool-is-better', priority: 0.6 },
  { path: '/blog/how-to-convert-images-between-formats-png-jpg-webp-avif', priority: 0.6 },
  { path: '/blog/ultimate-guide-to-quickbg-batch-processing-tools', priority: 0.6 },
  { path: '/blog/quickbg-vs-canva-background-removal-and-editing-compared', priority: 0.6 },
  { path: '/blog/quickbg-vs-adobe-photoshop-free-alternative-background-removal', priority: 0.6 },
  { path: '/blog/social-media-image-sizes-2026-complete-cheat-sheet', priority: 0.6 },
  { path: '/blog/creating-consistent-brand-imagery-instagram-tiktok', priority: 0.6 },
  { path: '/blog/how-to-build-image-processing-pipeline-online-store', priority: 0.6 },
  { path: '/blog/common-image-file-formats-explained-png-jpg-webp-avif', priority: 0.6 },
  { path: '/blog/10-image-editing-mistakes-that-hurt-your-conversion-rates', priority: 0.6 },
]

// English-only sitemap. The non-default locales (es/fr/de/hi) are intentionally
// excluded: their tool-page prose falls back to English, so those URLs would be
// mixed-language near-duplicates of the English pages — exactly what Google/AdSense
// flags as low-value / auto-generated content. The locale switcher still works for
// users; the localized routes are marked noindex (see src/app/layout.tsx). Re-add
// a locale here once its translations are 100% complete.
export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority }) => ({
    url: `${baseUrl}${path === '' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency: priority >= 0.9 ? 'weekly' : ('monthly' as const),
    priority,
  }))
}
