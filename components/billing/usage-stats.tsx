'use client'

import { useSubscription } from '@/lib/hooks/use-subscription'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface UsageStatsProps {
  searchesUsed?: number
  searchesLimit?: number
}

export function UsageStats({ searchesUsed = 0, searchesLimit }: UsageStatsProps) {
  const { subscription, isPro, isBasic } = useSubscription()

  // Determine search limit based on plan
  const getSearchLimit = () => {
    if (isPro) return null // Unlimited
    if (isBasic) return 100
    return 10 // Free plan
  }

  const limit = searchesLimit || getSearchLimit()
  const isUnlimited = limit === null
  const usagePercentage = isUnlimited ? 0 : Math.min((searchesUsed / limit) * 100, 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage This Month</CardTitle>
        <CardDescription>
          Track your search usage and remaining quota
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Searches</span>
              <span className="text-sm text-muted-foreground">
                {isUnlimited 
                  ? `${searchesUsed} searches` 
                  : `${searchesUsed} / ${limit}`
                }
              </span>
            </div>
            {!isUnlimited && (
              <Progress value={usagePercentage} className="h-2" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{searchesUsed}</p>
              <p className="text-sm text-muted-foreground">Searches Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {isUnlimited ? '∞' : Math.max(0, limit - searchesUsed)}
              </p>
              <p className="text-sm text-muted-foreground">
                {isUnlimited ? 'Unlimited' : 'Remaining'}
              </p>
            </div>
          </div>

          {!isUnlimited && usagePercentage > 80 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                You&apos;re approaching your monthly limit. Consider upgrading to avoid interruptions.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}