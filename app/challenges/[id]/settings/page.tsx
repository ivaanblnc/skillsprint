/**
 * Challenge Settings Page - Refactorized with Clean Architecture
 * Server Component que maneja la carga del challenge y validaciones
 */

export const dynamic = 'force-dynamic'

import { createServerClient } from "@/lib/supabase/server"
import { getMessages } from "@/lib/server-i18n"
import { redirect, notFound } from "next/navigation"
import { ChallengeSettingsClient } from "./challenge-settings-client"
import { Suspense } from "react"
import { ChallengeSettingsSkeleton } from "@/components/ui/challenge-settings-skeleton"
import { createChallengeDetailService } from "@/lib/services/challenge-detail.service"
import { createUserService } from "@/lib/services/user.service"

interface Props {
  params: { id: string }
}

export default async function ChallengeSettingsPage({ params }: Props) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/auth/login")
    }

    // Create services
    const challengeService = createChallengeDetailService(supabase)
    const userService = createUserService(supabase)

    // Get user details to check if they can access settings
    const userDetails = await userService.getUserProfile(user.id)
    
    if (!userDetails || (userDetails.role !== 'CREATOR' && userDetails.role !== 'ADMIN')) {
      redirect("/challenges")
    }

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

    // Get translations
    const messages = await getMessages()

    return (
      <Suspense fallback={<ChallengeSettingsSkeleton />}>
        <ChallengeSettingsClient
          challenge={{
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            points: challenge.points,
            timeLimit: challenge.timeLimit,
            startDate: challenge.startDate ? new Date(challenge.startDate) : new Date(),
            endDate: challenge.endDate ? new Date(challenge.endDate) : new Date(),
            status: challenge.status,
            creatorId: challenge.creatorId,
            _count: challenge._count || { submissions: 0 }
          }}
          translations={messages}
        />
      </Suspense>
    )

  } catch (error) {
    console.error("Challenge settings error:", error)
    notFound()
  }
}
