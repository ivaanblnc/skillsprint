/**
 * Leaderboard Skeleton - Loading component
 * Muestra esqueleto mientras cargan los datos del leaderboard
 */

import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-12">
        {/* Header Skeleton */}
        <div className="mb-12 text-center">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 glass-card liquid-border">
                    <Skeleton className="h-6 w-6" />
                  </div>
                  <div>
                    <Skeleton className="h-8 w-12 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leaderboard Skeleton */}
        <div className="max-w-4xl mx-auto">
          <Card className="glass-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Top 3 Special Cards */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-6 p-6 glass-card liquid-border-lg">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-8">
                      <div className="text-center">
                        <Skeleton className="h-6 w-12 mb-1" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mb-1" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Regular entries */}
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i + 3} className="flex items-center gap-6 p-4 hover:glass-card">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-28 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-8">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-5 w-6" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
