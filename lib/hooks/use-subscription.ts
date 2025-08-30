import { useEffect, useState } from 'react'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import type { UserSubscription } from '@/lib/stripe/types'

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('user_subscription_status')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          setError(error.message)
        } else {
          setSubscription(data)
        }
      } catch (err) {
        setError('Failed to fetch subscription')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()

    // Subscribe to subscription changes
    const subscription = supabase
      .channel('user_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        () => {
          fetchSubscription()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const isActive =
    subscription?.status === 'active' || subscription?.status === 'trialing'
  const isPro =
    subscription?.stripePriceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
  const isBasic =
    subscription?.stripePriceId ===
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC

  return {
    subscription,
    loading,
    error,
    isActive,
    isPro,
    isBasic,
    isSubscribed: !!subscription && isActive
  }
}
