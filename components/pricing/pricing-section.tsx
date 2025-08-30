'use client'

import { useState } from 'react'

import { toast } from 'sonner'

import { useSubscription } from '@/lib/hooks/use-subscription'
import { getStripe } from '@/lib/stripe'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/types'

import { PricingCard } from './pricing-card'

export function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null)
  const { subscription, isSubscribed } = useSubscription()

  const handleSubscribe = async (priceId: string) => {
    if (!priceId || priceId === '') {
      toast.error('This plan is not available yet')
      return
    }

    // Empêcher la souscription si l'utilisateur a déjà un abonnement actif
    if (isSubscribed) {
      toast.error(
        'You already have an active subscription. Please manage your current subscription instead.'
      )
      return
    }

    setLoading(priceId)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priceId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong'
      )
    } finally {
      setLoading(null)
    }
  }

  const getCurrentPlanId = () => {
    if (!isSubscribed) return 'free'
    return (
      SUBSCRIPTION_PLANS.find(
        plan => plan.priceId === subscription?.stripe_price_id
      )?.id || 'free'
    )
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Select the perfect plan for your AI-powered search needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {SUBSCRIPTION_PLANS.map(plan => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={getCurrentPlanId() === plan.id}
              onSubscribe={() => handleSubscribe(plan.priceId)}
              loading={loading === plan.priceId}
              hasActiveSubscription={isSubscribed}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
