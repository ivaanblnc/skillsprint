/**
 * Challenge Detail Page - Refactorized with Clean Architecture
 * Server Component que maneja la carga de datos del challenge
 */

import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { getMessages } from "@/lib/server-i18n"
import { ChallengeDetailClient } from "./challenge-detail-client"
import { Suspense } from "react"
import { ChallengeDetailSkeleton } from "@/components/ui/challenge-detail-skeleton"
import { createChallengeDetailService } from "@/lib/services/challenge-detail.service"
import { prisma } from "@/lib/prisma"

// Revalidate this page every 30 seconds to show updated submission statuses
export const revalidate = 30

interface ChallengeDetailPageProps {
  params: { id: string }
}

async function getUserIfAuthenticated() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Find the user in Prisma DB by email
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email || '' },
      select: { id: true, role: true }
    })

    // Return the Prisma user ID (CUID) and role, not the Supabase Auth ID (UUID)
    return dbUser ? { id: dbUser.id, role: dbUser.role } : null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

/**
 * Server Component principal del Challenge Detail
 * Maneja carga de datos y SSR
 */
export default async function ChallengeDetailPage({ params }: ChallengeDetailPageProps) {
  // Get authenticated user (Prisma User ID and role)
  const authData = await getUserIfAuthenticated()
  const userId = authData?.id || null
  const userRole = authData?.role || null
  
  // Get challenge data
  const supabase = await createServerClient()
  const challengeDetailService = createChallengeDetailService(supabase)
  
  const result = await challengeDetailService.getChallengeDetail(params.id, userId)
  
  if (!result.success || !result.data) {
    notFound()
  }

  // Get translations
  const messages = await getMessages()

  return (
    <Suspense fallback={<ChallengeDetailSkeleton />}>
      <ChallengeDetailClient
        challenge={result.data}
        authUser={userId ? { id: userId, role: userRole } as any : null}
        translations={messages}
      />
    </Suspense>
  )
}
