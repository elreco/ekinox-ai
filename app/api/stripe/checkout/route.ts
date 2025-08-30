import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { createCheckoutSession } from '@/lib/stripe'
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

    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const { sessionId, url } = await createCheckoutSession({
      priceId,
      userId: user.id,
      userEmail: user.email!,
      successUrl: `${origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id
      }
    })

    return NextResponse.json({ sessionId, url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
