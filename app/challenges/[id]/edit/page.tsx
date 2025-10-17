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
import { ChallengeCreateSkeleton } from "@/components/ui/challenge-create-skeleton"
import { createChallengeDetailService } from "@/lib/services/challenge-detail.service"
import { prisma } from "@/lib/prisma"

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

    // Find the user in Prisma DB by email to get the correct user ID
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email || '' },
      select: { id: true }
    })

    if (!dbUser) {
      redirect("/auth/login")
    }

    // Create services
    const challengeService = createChallengeDetailService(supabase)

    // Load challenge data with correct Prisma user ID
    const challengeResult = await challengeService.getChallengeDetail(params.id, dbUser.id)

    if (!challengeResult.success || !challengeResult.data) {
      notFound()
    }

    const challenge = challengeResult.data

    // Check if user owns this challenge
    if (challenge.creatorId !== dbUser.id) {
      redirect("/challenges")
    }

    // Get translations
    const messages = await getMessages()

    return (
      <Suspense fallback={<ChallengeCreateSkeleton />}>
        <ChallengeEditClient
          challenge={challenge}
          userId={dbUser.id}
          translations={messages}
        />
      </Suspense>
    )

  } catch (error) {
    console.error("Challenge edit error:", error)
    notFound()
  }
}
