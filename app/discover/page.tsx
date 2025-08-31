import { headers } from 'next/headers'

import { getCachedTrendingMedia } from '@/lib/cache/media-cache'
import { getCountryFromLocale } from '@/lib/services/news-service'

import { DiscoverPage } from '@/components/discover/discover-page'

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

  return <DiscoverPage media={trendingMedia} userCountry={userCountry} />
}
