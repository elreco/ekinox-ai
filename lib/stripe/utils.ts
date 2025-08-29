import { stripe } from './config'
import type {
  CreateCheckoutSessionParams,
  CreatePortalSessionParams
} from './types'

export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
  metadata = {}
}: CreateCheckoutSessionParams) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
        ...metadata
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        metadata: {
          userId,
          ...metadata
        }
      }
    })

    return { sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export async function createPortalSession({
  customerId,
  returnUrl
}: CreatePortalSessionParams) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    })

    return { url: session.url }
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })

    return subscription
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

export async function resumeSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    })

    return subscription
  } catch (error) {
    console.error('Error resuming subscription:', error)
    throw error
  }
}

export async function getCustomerById(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return customer
  } catch (error) {
    console.error('Error retrieving customer:', error)
    throw error
  }
}

export async function getSubscriptionById(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    throw error
  }
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(price)
}

export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status)
}

export function isSubscriptionCanceled(status: string): boolean {
  return ['canceled', 'incomplete_expired', 'unpaid'].includes(status)
}
