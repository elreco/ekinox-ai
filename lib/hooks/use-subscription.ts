import { useEffect, useState } from 'react'

import type { UserSubscription } from '@/lib/stripe/types'
import { createClient } from '@/lib/supabase/client'

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

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

        // Essayer d'abord sans .single() pour debug
        const { data: allData, error: allError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)

        if (allError) {
          console.error('Subscription fetch error:', allError)
          setError(allError.message)
          return
        }

        // Prendre la première subscription si elle existe
        const subscription = allData && allData.length > 0 ? allData[0] : null

        setSubscription(subscription)
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
    subscription?.stripe_price_id ===
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO

  return {
    subscription,
    loading,
    error,
    isActive,
    isPro,
    isSubscribed: !!subscription && isActive
  }
}
