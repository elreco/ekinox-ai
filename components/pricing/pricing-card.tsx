import type { SubscriptionPlan } from '@/lib/stripe/types'
import { formatPrice } from '@/lib/stripe/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'

interface PricingCardProps {
  plan: SubscriptionPlan
  currentPlan?: boolean
  onSubscribe?: () => void
  loading?: boolean
  hasActiveSubscription?: boolean
}

export function PricingCard({
  plan,
  currentPlan,
  onSubscribe,
  loading,
  hasActiveSubscription
}: PricingCardProps) {
  return (
    <Card
      className={`relative ${plan.popular ? 'border-2 border-primary' : ''}`}
    >
      {plan.popular && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="text-center pb-4">
        <div className="mb-4">
          <span className="text-4xl font-bold">
            {plan.price === 0 ? 'Free' : formatPrice(plan.price, plan.currency)}
          </span>
          {plan.price > 0 && (
            <span className="text-muted-foreground ml-1">/{plan.interval}</span>
          )}
        </div>

        <ul className="text-sm space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Icons.check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={
            currentPlan ? 'outline' : plan.popular ? 'default' : 'outline'
          }
          onClick={onSubscribe}
          disabled={
            currentPlan || loading || (hasActiveSubscription && !currentPlan)
          }
        >
          {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {currentPlan
            ? 'Current Plan'
            : hasActiveSubscription && plan.price > 0
              ? 'Active Subscription'
              : plan.price === 0
                ? hasActiveSubscription
                  ? 'Free Plan'
                  : 'Get Started'
                : 'Subscribe'}
        </Button>
      </CardFooter>
    </Card>
  )
}
