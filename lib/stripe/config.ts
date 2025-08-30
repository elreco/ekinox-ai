import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js'
import Stripe from 'stripe'

// Check environment variables only on server side
if (typeof window === 'undefined') {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

// Only initialize Stripe on server side
export const stripe =
  typeof window === 'undefined'
    ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-08-27.basil',
        typescript: true
      })
    : (null as any as Stripe)

let stripePromise: Promise<StripeJS | null>

export const getStripe = (): Promise<StripeJS | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export const config = {
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    // Server-side only configs
    ...(typeof window === 'undefined' && {
      secretKey: process.env.STRIPE_SECRET_KEY!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      prices: {
        pro: process.env.STRIPE_PRICE_ID_PRO!
      }
    }),
    // Client and server configs
    testMode: process.env.STRIPE_TEST_MODE === 'true'
  }
} as const
