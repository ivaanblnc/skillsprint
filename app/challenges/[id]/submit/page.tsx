/**
 * Challenge Submit Page - Refactorized with Clean Architecture
 * Server Component que maneja la carga del challenge y validaciones
 */

export const dynamic = 'force-dynamic'

import { createServerClient } from "@/lib/supabase/server"
import { getMessages } from "@/lib/server-i18n"
import { redirect, notFound } from "next/navigation"
import { ChallengeSubmitClient } from "./challenge-submit-client"
import { Suspense } from "react"
import { ChallengeSubmitSkeleton } from "@/components/ui/challenge-submit-skeleton"
import { createChallengeDetailService } from "@/lib/services/challenge-detail.service"

interface Props {
  params: { id: string }
}

/**
 * Server Component principal de Submit Challenge
 * Maneja autenticación, carga de datos y validaciones
 */
export default async function ChallengeSubmitPage({ params }: Props) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/auth/login")
    }

    // Create services
    const challengeService = createChallengeDetailService(supabase)

    // Load challenge data 
    const challengeResult = await challengeService.getChallengeDetail(params.id, user.id)

    if (!challengeResult.success || !challengeResult.data) {
      notFound()
    }

    const challenge = challengeResult.data

    // Check if challenge is active and user can submit
    if (challenge.status !== 'ACTIVE') {
      redirect(`/challenges/${params.id}`)
    }

    // Check if challenge has ended
    if (challenge.endDate && new Date() > new Date(challenge.endDate)) {
      redirect(`/challenges/${params.id}`)
    }

    // Get translations
    const messages = await getMessages()

    return (
      <Suspense fallback={<ChallengeSubmitSkeleton />}>
        <ChallengeSubmitClient
          challenge={challenge as any}
          userId={user.id}
          translations={messages}
        />
      </Suspense>
    )

  } catch (error) {
    console.error("Challenge submit error:", error)
    notFound()
  }
}
