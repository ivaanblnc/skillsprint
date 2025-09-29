/**
 * Challenge Edit Page - Refactorized with Clean Architecture
 * Server Component que maneja la carga del challenge y validaciones
 */

export const dynamic = 'force-dynamic'

import { createServerClient } from "@/lib/supabase/server"
import { getMessages } from "@/lib/server-i18n"
import { redirect, notFound } from "next/navigation"
import { ChallengeEditClient } from "./challenge-edit-client"
import { Suspense } from "react"
import { ChallengeCreateSkeleton } from "@/components/ui/challenge-create-skeleton" // Reusing skeleton
import { createChallengeDetailService } from "@/lib/services/challenge-detail.service"
import { createUserService } from "@/lib/services/user.service"

interface Props {
  params: { id: string }
}

export default async function ChallengeEditPage({ params }: Props) {
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

    // Check if user owns this challenge
    if (challenge.creatorId !== user.id) {
      redirect("/challenges")
    }

    // Only allow editing of DRAFT challenges
    if (challenge.status !== 'DRAFT') {
      redirect(`/challenges/${params.id}`)
    }

    // Get translations
    const messages = await getMessages()

    return (
      <Suspense fallback={<ChallengeCreateSkeleton />}>
        <ChallengeEditClient
          challenge={challenge}
          testCases={challenge.testCases || []}
          translations={messages}
        />
      </Suspense>
    )

  } catch (error) {
    console.error("Challenge edit error:", error)
    notFound()
  }
}
