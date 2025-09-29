/**
 * Challenge Manage Page - Refactorized with Clean Architecture
 * Server Component que maneja la carga de challenges del usuario
 */

export const dynamic = 'force-dynamic'

import { createServerClient } from "@/lib/supabase/server"
import { getMessages } from "@/lib/server-i18n"
import { redirect } from "next/navigation"
import { ChallengeManageClient } from "./challenge-manage-client"
import { Suspense } from "react"
import { ChallengeManageSkeleton } from "@/components/ui/challenge-manage-skeleton"
import { createChallengeDetailService } from "@/lib/services/challenge-detail.service"

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

interface ChallengeManagePageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

/**
 * Server Component principal de Challenge Manage
 * Maneja autenticación y carga de datos
 */
export default async function ChallengeManagePage({ searchParams }: ChallengeManagePageProps) {
  // Verify authentication
  const authUser = await getUserIfAuthenticated()
  
  if (!authUser) {
    redirect("/auth/login?returnUrl=/challenges/manage")
  }

  // Parse search parameters
  const page = Number(searchParams.page) || 1
  const search = typeof searchParams.search === 'string' ? searchParams.search : ''

  // Get user challenges
  const supabase = await createServerClient()
  const challengeDetailService = createChallengeDetailService(supabase)
  
  const result = await challengeDetailService.getUserChallenges(authUser.id, page, 3, search)

  // Get translations
  const messages = await getMessages()

  return (
    <Suspense fallback={<ChallengeManageSkeleton />}>
      <ChallengeManageClient
        initialChallenges={result.success ? result.data!.challenges : []}
        initialPagination={result.success ? result.data!.pagination : {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        }}
        authUser={authUser}
        translations={messages}
      />
    </Suspense>
  )
}
