import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://quickbg.dev', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://quickbg.dev/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://quickbg.dev/tools', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://quickbg.dev/remover', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://quickbg.dev/replace-bg', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://quickbg.dev/blur-bg', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://quickbg.dev/resize', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://quickbg.dev/crop', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://quickbg.dev/adjust', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://quickbg.dev/sharpness', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://quickbg.dev/converter', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://quickbg.dev/faq', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://quickbg.dev/blog', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://quickbg.dev/comparison', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://quickbg.dev/privacy', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: 'https://quickbg.dev/terms', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: 'https://quickbg.dev/legal', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: 'https://quickbg.dev/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://quickbg.dev/blog/how-ai-background-removal-works', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://quickbg.dev/blog/transparent-pngs-amazon-etsy', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://quickbg.dev/blog/ecommerce-product-photos-guide', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://quickbg.dev/blog/best-free-image-editing-workflow', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://quickbg.dev/blog/common-mistakes-ai-background-removal', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]
}
