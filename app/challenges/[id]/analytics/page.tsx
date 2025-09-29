import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { DashboardNav } from '@/components/dashboard-nav'
import { ChallengeAnalyticsSkeleton } from '@/components/ui/challenge-analytics-skeleton'
import { ChallengeAnalyticsClient } from './challenge-analytics-client'
import { AnalyticsService } from '@/lib/services/analytics.service'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

async function ChallengeAnalyticsContent({ challengeId, userId }: { challengeId: string, userId: string }) {
  try {
    const { challenge, analytics } = await AnalyticsService.getChallengeAnalytics(challengeId, userId)
    
    if (!challenge) {
      notFound()
    }

    return <ChallengeAnalyticsClient challenge={challenge} analytics={analytics} />
  } catch (error) {
    console.error('Error loading challenge analytics:', error)
    notFound()
  }
}

export default async function ChallengeAnalyticsPage({ params }: PageProps) {
  const supabase = await createServerClient()
  const { data: userData, error } = await supabase.auth.getUser()
  
  if (error || !userData?.user) {
    redirect('/auth/login')
  }

  // Verify user exists and is a CREATOR
  const user = await prisma.user.findUnique({
    where: { id: userData.user.id },
    select: { id: true, role: true }
  })

  if (!user || user.role !== "CREATOR") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<ChallengeAnalyticsSkeleton />}>
          <ChallengeAnalyticsContent challengeId={params.id} userId={user.id} />
        </Suspense>
      </main>
    </div>
  )
}
