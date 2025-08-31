import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to manually refresh the media cache
 * Usage: POST /api/media/refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request is authorized (you can add authentication here)
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // Optional: Add a secret key for security
    if (process.env.CACHE_REFRESH_SECRET && secret !== process.env.CACHE_REFRESH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Revalidate the media cache
    revalidateTag('media')
    revalidateTag('discover')
    
    console.log('🔄 Media cache manually refreshed via API')
    
    return NextResponse.json({ 
      message: 'Media cache refreshed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error refreshing media cache:', error)
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    )
  }
}