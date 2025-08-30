'use client'

import type { UserSubscription } from '@/lib/stripe/types'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/types'
import { formatPrice, isSubscriptionActive } from '@/lib/stripe/utils'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BillingInfoProps {
  subscription: UserSubscription | null
}

export function BillingInfo({ subscription }: BillingInfoProps) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            <Badge variant="secondary">Free</Badge>
          </CardTitle>
          <CardDescription>
            You&apos;re currently on the free plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • 10 searches per month
            </p>
            <p className="text-sm text-muted-foreground">
              • Basic AI models
            </p>
            <p className="text-sm text-muted-foreground">
              • Community support
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentPlan = SUBSCRIPTION_PLANS.find(
    plan => plan.priceId === subscription.stripePriceId
  )

  const isActive = isSubscriptionActive(subscription.status)
  const statusColor = isActive ? 'default' : 'destructive'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Current Plan
          <Badge variant={statusColor}>
            {currentPlan?.name || 'Unknown Plan'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Status: {subscription.status}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Price</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan ? 
                  `${formatPrice(currentPlan.price, currentPlan.currency)}/${currentPlan.interval}` : 
                  'Unknown'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground capitalize">
                {subscription.status.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Current Period</p>
              <p className="text-sm text-muted-foreground">
                {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Renewal</p>
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd 
                  ? 'Canceling at period end' 
                  : 'Auto-renew enabled'
                }
              </p>
            </div>
          </div>

          {currentPlan && (
            <div>
              <p className="text-sm font-medium mb-2">Features</p>
              <div className="space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    • {feature}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}