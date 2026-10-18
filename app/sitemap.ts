import type { MetadataRoute } from 'next';

const siteUrl = 'https://order-book-simulator.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}/manipulation`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
