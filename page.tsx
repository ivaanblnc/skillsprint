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
import { createSubmissionService } from "@/lib/services/submission.service"

interface Props {
  params: { id: string }
}

export default async function ChallengeSubmitPage({ params }: Props) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      redirect("/auth/login")
    }

    const challengeService = createChallengeDetailService(supabase)
    const submissionService = createSubmissionService(supabase)

    const [challenge, submissionHistory, testCases] = await Promise.all([
      challengeService.getChallenge(params.id),
      submissionService.getSubmissionHistory(params.id, user.id),
      submissionService.getTestCases(params.id, false)
    ])

    if (!challenge) {
      notFound()
    }

    if (challenge.status !== 'ACTIVE') {
      redirect(`/challenges/${params.id}`)
    }

    if (new Date() > new Date(challenge.endDate)) {
      redirect(`/challenges/${params.id}`)
    }

    const messages = await getMessages()

    return (
      <Suspense fallback={<ChallengeSubmitSkeleton />}>
        <ChallengeSubmitClient 
          challenge={challenge}
          user={user}
          submissionHistory={submissionHistory}
          testCases={testCases}
          translations={messages}
        />
      </Suspense>
    )
    
  } catch (error) {
    console.error("Challenge submit error:", error)
    notFound()
  }
}
