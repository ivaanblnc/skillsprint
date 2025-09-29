/**
 * Challenge Create Page - Refactorized with Clean Architecture
 * Server Component que maneja la autenticación y datos iniciales
 */

export const dynamic = 'force-dynamic'

import { createServerClient } from "@/lib/supabase/server"
import { getMessages } from "@/lib/server-i18n"
import { redirect } from "next/navigation"
import { ChallengeCreateClient } from "./challenge-create-client"
import { Suspense } from "react"
import { ChallengeCreateSkeleton } from "@/components/ui/challenge-create-skeleton"

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
 * Server Component principal de Challenge Create
 * Maneja autenticación y carga inicial
 */
export default async function ChallengeCreatePage() {
  // Verify authentication and permissions
  const authUser = await getUserIfAuthenticated()
  
  if (!authUser) {
    redirect("/auth/login?returnUrl=/challenges/create")
  }

  // Get translations
  const messages = await getMessages()

  return (
    <Suspense fallback={<ChallengeCreateSkeleton />}>
      <ChallengeCreateClient
        authUser={authUser}
        translations={messages}
      />
    </Suspense>
  )
}
