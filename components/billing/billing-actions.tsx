'use client'

import { useState } from 'react'

import { toast } from 'sonner'

import { useSubscription } from '@/lib/hooks/use-subscription'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'

export function BillingActions() {
  const [loading, setLoading] = useState(false)
  const { subscription, isSubscribed } = useSubscription()

  const handleManageSubscription = async () => {
    if (!isSubscribed) {
      toast.error('No active subscription found')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      window.open(data.url, '_blank')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subscription</CardTitle>
        <CardDescription>
          Update payment method, download invoices, or cancel subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={handleManageSubscription}
            disabled={!isSubscribed || loading}
            className="w-full"
          >
            {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {isSubscribed ? 'Manage Subscription' : 'No Active Subscription'}
          </Button>

          {isSubscribed && subscription && (
            <div className="text-sm text-muted-foreground">
              <p>• Update payment method</p>
              <p>• Download invoices and receipts</p>
              <p>• View billing history</p>
              <p>• Cancel or pause subscription</p>
              <p>• Update billing address</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}