import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { getCachedTrendingMedia } from '@/lib/cache/media-cache'
import { getCountryFromLocale } from '@/lib/services/news-service'

import { DiscoverPage } from '@/components/discover/discover-page'

export const metadata: Metadata = {
  title: 'Discover Trending Content - Latest Articles, Research & Videos',
  description: 'Explore trending articles, research papers, videos, podcasts and reports from around the world. Stay updated with the latest in technology, business, science, health and more.',
  keywords: [
    'trending content',
    'latest news',
    'research papers',
    'tech videos',
    'business podcasts',
    'science articles',
    'content discovery',
    'AI-curated content'
  ],
  openGraph: {
    title: 'Discover Trending Content - Latest Articles, Research & Videos',
    description: 'Explore trending articles, research papers, videos, podcasts and reports from around the world.',
    url: 'https://www.ekinox.app/discover',
    images: [
      {
        url: '/images/og-discover.png',
        width: 1200,
        height: 630,
        alt: 'Ekinox AI Discover - Trending Content Discovery',
      },
    ],
  },
  twitter: {
    title: 'Discover Trending Content - Latest Articles, Research & Videos',
    description: 'Explore trending articles, research papers, videos, podcasts and reports from around the world.',
    images: ['/images/og-discover.png'],
  },
}

export default async function Discover() {
  // Detect user country from Accept-Language header
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')
  const userLocale = acceptLanguage?.split(',')[0]?.split(';')[0] || 'en-US'
  const userCountry = getCountryFromLocale(userLocale)

  // Get cached trending media - refreshes automatically every 2 hours
  const trendingMedia = await getCachedTrendingMedia(
    ['article', 'research', 'video', 'podcast', 'blog', 'report'],
    userCountry,
    userLocale
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Discover Trending Content',
    description: 'Explore trending articles, research papers, videos, podcasts and reports from around the world.',
    url: 'https://www.ekinox.app/discover',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: trendingMedia.length,
      itemListElement: trendingMedia.slice(0, 10).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': item.mediaType === 'article' ? 'Article' : 
                   item.mediaType === 'video' ? 'VideoObject' :
                   item.mediaType === 'research' ? 'ScholarlyArticle' : 'CreativeWork',
          name: item.title,
          description: item.description,
          url: item.url,
          datePublished: item.publishedAt.toISOString(),
          publisher: {
            '@type': 'Organization',
            name: item.source
          },
          ...(item.imageUrl && {
            image: {
              '@type': 'ImageObject',
              url: item.imageUrl
            }
          }),
          ...(item.duration && {
            duration: `PT${item.duration.replace(':', 'M').replace(':', 'S')}S`
          })
        }
      }))
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DiscoverPage media={trendingMedia} userCountry={userCountry} />
    </>
  )
}
