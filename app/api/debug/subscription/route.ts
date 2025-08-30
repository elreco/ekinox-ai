import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', authError },
        { status: 401 }
      )
    }

    console.log('DEBUG: Fetching subscription for user:', user.id)

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)

    console.log('DEBUG: Query result:', { data, error })

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      subscriptions: data,
      error,
      count: data?.length || 0
    })
  } catch (error) {
    console.error('DEBUG: Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
