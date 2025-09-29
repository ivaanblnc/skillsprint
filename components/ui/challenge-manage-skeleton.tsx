/**
 * Challenge Manage Skeleton Component
 * Loading placeholder para la gestión de challenges
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardNav } from "@/components/dashboard-nav"

export function ChallengeManageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-4 w-32 mb-4" />
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Search and Filters Skeleton */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>

          {/* Challenges List Skeleton */}
          <div className="space-y-6">
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full max-w-md" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      ))}
                    </div>

                    {/* Dates Skeleton */}
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-32" />
                    </div>

                    {/* Actions Skeleton */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-18" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-1">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
