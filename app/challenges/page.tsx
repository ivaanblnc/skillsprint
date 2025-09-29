/**
 * Challenges Page - Refactorized with Clean Architecture
 * Server Component que maneja la lógica de datos
 */

import { challengesService } from "@/lib/services/challenges.service"
import { getMessages, translate } from "@/lib/server-i18n"
import { ChallengesClient } from "./challenges-client"
import { Suspense } from "react"
import { ChallengesSkeleton } from "@/components/ui/challenges-skeleton"
import type { FilterState } from "@/lib/types"

// Revalidate this page every 30 seconds to show updated submission statuses
export const revalidate = 30

interface ChallengesPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

/**
 * Server Component principal de Challenges
 * Maneja carga de datos y SSR
 */
export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  // Parse search parameters
  const page = Number(searchParams.page) || 1
  const difficulty = typeof searchParams.difficulty === 'string' ? searchParams.difficulty : undefined
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined
  
  // Build filters object
  const filters: FilterState = {
    difficulty: difficulty as any,
    search
  }

  // Get challenges data
  const { challenges, pagination } = await challengesService.getChallenges(page, filters)
  
  // Get translations
  const messages = await getMessages()

  return (
    <Suspense fallback={<ChallengesSkeleton />}>
      <ChallengesClient 
        initialChallenges={challenges}
        pagination={pagination}
        currentFilters={filters}
        translations={messages}
      />
    </Suspense>
  )
}
