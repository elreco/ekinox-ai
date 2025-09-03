import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to manually refresh the suggestions cache
 * Usage: POST /api/suggestions/refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request is authorized (you can add authentication here)
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Optional: Add a secret key for security
    if (
      process.env.CACHE_REFRESH_SECRET &&
      secret !== process.env.CACHE_REFRESH_SECRET
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Revalidate the suggestions cache
    revalidateTag('suggestions')
    revalidateTag('homepage')

    console.log('🔄 Suggestions cache manually refreshed via API')

    return NextResponse.json({
      message: 'Suggestions cache refreshed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error refreshing suggestions cache:', error)
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    )
  }
}
