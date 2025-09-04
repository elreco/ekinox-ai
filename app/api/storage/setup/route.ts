import { NextResponse } from 'next/server'
import { serverStorageService } from '@/lib/supabase/server-storage'

export async function POST() {
  try {
    const result = await serverStorageService.setupBucket()
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Setup API error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}