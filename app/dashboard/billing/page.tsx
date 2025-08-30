import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

import { Skeleton } from '@/components/ui/skeleton'

import { BillingActions, BillingInfo, UsageStats } from '@/components/billing'
import { PricingSection } from '@/components/pricing'

export default async function BillingPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
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
  )
}

async function BillingContent({ userId }: { userId: string }) {
  const supabase = createServerComponentClient({ cookies })

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
        <UsageStats searchesUsed={searchesUsed} />
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