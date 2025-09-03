import { unstable_cache } from 'next/cache'

import {
  getTrendingSuggestions,
  type SuggestionItem
} from '@/lib/services/suggestions-service'

// Cache duration: 24 hours (86400 seconds)
const CACHE_DURATION = 24 * 60 * 60 // 24 hours in seconds

/**
 * Cached version of getTrendingSuggestions that refreshes every 24 hours
 */
export const getCachedSuggestions = unstable_cache(
  async (): Promise<SuggestionItem[]> => {
    console.log(`🔄 Fetching fresh trending suggestions from Tavily API...`)
    const startTime = Date.now()

    try {
      const suggestions = await getTrendingSuggestions()
      const endTime = Date.now()

      console.log(
        `✅ Successfully fetched ${suggestions.length} trending suggestions in ${endTime - startTime}ms`
      )
      return suggestions
    } catch (error) {
      console.error('❌ Error fetching suggestions from cache:', error)
      return []
    }
  },
  // Cache key for suggestions
  ['trending-suggestions'],
  {
    revalidate: CACHE_DURATION, // Revalidate every 24 hours
    tags: ['suggestions', 'homepage'] // Tags for manual cache invalidation if needed
  }
)

/**
 * Function to manually invalidate the suggestions cache if needed
 */
export async function invalidateSuggestionsCache() {
  console.log('🗑️ Manually invalidating suggestions cache...')
  // In Next.js App Router, you would use revalidateTag
  // revalidateTag('suggestions')
}
