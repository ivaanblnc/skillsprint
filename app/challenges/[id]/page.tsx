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
    
    return user
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
  // Get authenticated user
  const authUser = await getUserIfAuthenticated()
  
  // Get challenge data
  const supabase = await createServerClient()
  const challengeDetailService = createChallengeDetailService(supabase)
  
  const result = await challengeDetailService.getChallengeDetail(params.id, authUser?.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  // Get translations
  const messages = await getMessages()

  return (
    <Suspense fallback={<ChallengeDetailSkeleton />}>
      <ChallengeDetailClient
        challenge={result.data}
        authUser={authUser}
        translations={messages}
      />
    </Suspense>
  )
}
