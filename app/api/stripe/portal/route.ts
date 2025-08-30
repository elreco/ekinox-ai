import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { createPortalSession } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID from database
    const { data: profile, error: profileError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const { url } = await createPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl: `${origin}/dashboard/billing`
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
