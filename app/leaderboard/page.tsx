/**
 * Leaderboard Page - Refactorized with Clean Architecture
 * Server Component que maneja la lógica de datos del leaderboard
 */

export const dynamic = 'force-dynamic'

import { getMessages, translate } from "@/lib/server-i18n"
import { LeaderboardClient } from "./leaderboard-client"
import { createLeaderboardService } from "@/lib/services/leaderboard.service"
import { Suspense } from "react"
import { LeaderboardSkeleton } from "@/components/ui/leaderboard-skeleton"

/**
 * Server Component principal del Leaderboard
 * Maneja carga de datos y estadísticas globales
 */
export default async function LeaderboardPage() {
  try {
    // Crear servicio de leaderboard y obtener datos
    const leaderboardService = createLeaderboardService()
    const [leaderboardData, stats] = await Promise.all([
      leaderboardService.getLeaderboard(),
      leaderboardService.getGlobalStats()
    ])

    // Get translations
    const messages = await getMessages()

    return (
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardClient 
          leaderboardData={leaderboardData}
          stats={stats}
          translations={messages}
        />
      </Suspense>
    )
    
  } catch (error) {
    console.error("Leaderboard error:", error)
    
    // En caso de error, mostrar página con datos vacíos
    const messages = await getMessages()
    return (
      <LeaderboardClient 
        leaderboardData={[]}
        stats={{
          totalUsers: 0,
          totalChallenges: 0,
          totalSubmissions: 0,
          activeUsers: 0
        }}
        translations={messages}
      />
    )
  }
}
