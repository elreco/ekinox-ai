import { unstable_cache } from 'next/cache'

import type { MediaItem, MediaType } from '@/lib/services/media-service'
import { getTrendingMedia } from '@/lib/services/media-service'

// Cache duration: 2 hours (7200 seconds)
const CACHE_DURATION = 2 * 60 * 60 // 2 hours in seconds

/**
 * Cached version of getTrendingMedia that refreshes every 2 hours
 */
const getCachedTrendingMediaRaw = unstable_cache(
  async (
    mediaTypes: MediaType[],
    userCountry?: string,
    userLocale?: string
  ): Promise<MediaItem[]> => {
    console.log(`🔄 Fetching fresh media data from Tavily API...`)
    const startTime = Date.now()
    
    try {
      const media = await getTrendingMedia(mediaTypes, userCountry, userLocale)
      const endTime = Date.now()
      
      console.log(`✅ Successfully fetched ${media.length} media items in ${endTime - startTime}ms`)
      return media
    } catch (error) {
      console.error('❌ Error fetching media from cache:', error)
      return []
    }
  },
  // Cache key includes parameters to ensure different cache for different requests
  ['trending-media'],
  {
    revalidate: CACHE_DURATION, // Revalidate every 2 hours
    tags: ['media', 'discover'] // Tags for manual cache invalidation if needed
  }
)

/**
 * Wrapper that ensures Date objects are properly reconstructed from cache
 */
export const getCachedTrendingMedia = async (
  mediaTypes: MediaType[],
  userCountry?: string,
  userLocale?: string
): Promise<MediaItem[]> => {
  const cachedMedia = await getCachedTrendingMediaRaw(mediaTypes, userCountry, userLocale)
  
  // Ensure publishedAt is a proper Date object
  return cachedMedia.map(item => ({
    ...item,
    publishedAt: new Date(item.publishedAt)
  }))
}

/**
 * Function to manually invalidate the media cache if needed
 * This would be called from an admin endpoint or cron job
 */
export async function invalidateMediaCache() {
  console.log('🗑️ Manually invalidating media cache...')
  // In Next.js App Router, you would use revalidateTag
  // revalidateTag('media')
}