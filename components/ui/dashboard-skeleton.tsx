/**
 * Dashboard Skeleton - Loading component
 * Muestra esqueleto mientras cargan los datos
 */

import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section Skeleton */}
        <Card className="glass-card mb-12 p-8 liquid-border-lg glass-elevated">
          <div className="flex items-center gap-6 mb-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-3" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <Card className="glass-elevated h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 glass-card liquid-border-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Recent Activity Skeleton */}
            <Card className="glass-elevated">
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 glass-card liquid-border">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions Skeleton */}
            <Card className="glass-elevated">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
