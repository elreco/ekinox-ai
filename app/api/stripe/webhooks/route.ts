import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe'

// Initialize Supabase with service role for database writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.client_reference_id
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId || !customerId || !subscriptionId) {
    console.error('Missing required data in checkout session')
    return
  }

  // Retrieve the subscription to get more details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0].price.id
  // Upsert user subscription record
  const { error } = await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    status: subscription.status,
    current_period_start: new Date(
      subscription.items.data[0].current_period_start * 1000
    ),
    current_period_end: new Date(
      subscription.items.data[0].current_period_end * 1000
    ),
    cancel_at_period_end: subscription.cancel_at_period_end,
    created_at: new Date(),
    updated_at: new Date()
  })

  if (error) {
    console.error('Error updating user subscription:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0].price.id

  // Get user ID from customer
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return

  const userId = customer.metadata?.userId
  if (!userId) return

  const { error } = await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    status: subscription.status,
    current_period_start: new Date(
      subscription.items.data[0].current_period_start * 1000
    ),
    current_period_end: new Date(
      subscription.items.data[0].current_period_end * 1000
    ),
    cancel_at_period_end: subscription.cancel_at_period_end,
    created_at: new Date(),
    updated_at: new Date()
  })

  if (error) {
    console.error('Error creating user subscription:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0].price.id

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_start: new Date(
        subscription.items.data[0].current_period_start * 1000
      ),
      current_period_end: new Date(
        subscription.items.data[0].current_period_end * 1000
      ),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error deleting subscription:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.lines.data[0].subscription

  if (subscriptionId) {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating subscription after payment:', error)
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.lines.data[0].subscription

  if (subscriptionId) {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating subscription after failed payment:', error)
    }
  }
}
