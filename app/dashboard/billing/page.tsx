import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { Skeleton } from '@/components/ui/skeleton'

import { BillingActions } from '@/components/billing/billing-actions'
import { BillingInfo } from '@/components/billing/billing-info'
import { PricingSection } from '@/components/pricing/pricing-section'

export default async function BillingPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view usage, and billing information
        </p>
      </div>

      <Suspense fallback={<BillingSkeleton />}>
        <BillingContent userId={user.id} />
      </Suspense>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Upgrade Your Plan</h2>
          <PricingSection />
        </div>
      </div>
    </div>
  )
}

async function BillingContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  // Fetch user subscription
  const { data: subscription } = await supabase
    .from('user_subscription_status')
    .select('*')
    .eq('user_id', userId)
    .single()

  // In a real app, you'd fetch usage stats from your database
  // For now, we'll use mock data
  const searchesUsed = 25

  return (
    <div className="grid lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <BillingInfo subscription={subscription} />
      </div>
      <div className="space-y-6">
        <BillingActions />
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Usage Statistics</h3>
          <p className="text-sm text-muted-foreground">
            Searches used: {searchesUsed}
          </p>
        </div>
      </div>
    </div>
  )
}

function BillingSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}