import type Stripe from 'stripe'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  priceId: string
  popular?: boolean
}

export interface UserSubscription {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  status: Stripe.Subscription.Status
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateCheckoutSessionParams {
  priceId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface CreatePortalSessionParams {
  customerId: string
  returnUrl: string
}

export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.created'

export interface WebhookHandler {
  event: StripeWebhookEvent
  handler: (data: any) => Promise<void>
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For discovering Ekinox AI',
    price: 0,
    currency: 'usd',
    interval: 'month',
    priceId: '',
    features: ['Unlimited searches', 'Speed model only', 'Community support']
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and power users',
    price: 20,
    currency: 'usd',
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '',
    popular: true,
    features: [
      'Unlimited searches',
      'All premium AI models',
      'Priority support',
      'All models'
    ]
  }
]
