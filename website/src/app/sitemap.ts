import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://quickbg.dev',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Add other tool pages if they have separate URLs down the line, like:
    // { url: 'https://quickbg.dev/resize', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 }
  ]
}