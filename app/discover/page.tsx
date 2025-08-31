import { headers } from 'next/headers'

import {
  getCountryFromLocale,
  getTrendingTopics
} from '@/lib/services/news-service'

import { DiscoverPage } from '@/components/discover/discover-page'

export default async function Discover() {
  // Detect user country from Accept-Language header
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')
  const userLocale = acceptLanguage?.split(',')[0]?.split(';')[0] || 'en-US'
  const userCountry = getCountryFromLocale(userLocale)

  // Get trending news from internet - this includes both worldwide and country-specific news
  const trendingNews = await getTrendingTopics(userCountry, userLocale)

  return <DiscoverPage news={trendingNews} userCountry={userCountry} />
}
