/**
 * Dashboard Page - Refactorized with Clean Architecture
 * Server Component que maneja la lógica de datos
 */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { getMessages, translate } from "@/lib/server-i18n"
import { createDashboardService } from "@/lib/services/dashboard.service"
import { DashboardClient } from "./dashboard-client"
import { Suspense } from "react"
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton"

/**
 * Server Component principal del Dashboard
 * Maneja autenticación y carga de datos
 */
export default async function DashboardPage() {
  // Get translations for the server
  const messages = await getMessages()
  const t = (key: string, params?: Record<string, string>) => translate(messages, key, params)

  try {
    // Crear el cliente de Supabase
    const supabase = await createServerClient()
    
    // Verificar autenticación
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      console.error("Authentication error:", userError)
      redirect("/auth/login")
    }

    const authUser = userData.user

    // Crear servicio de dashboard y obtener datos
    const dashboardService = createDashboardService(supabase)
    const dashboardData = await dashboardService.getDashboardData(authUser.id)
    
    if (!dashboardData || !dashboardData.user) {
      console.error("Failed to fetch dashboard data")
      redirect("/auth/login")
    }

    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient 
          user={dashboardData.user}
          authUser={authUser}
          stats={dashboardData.stats}
          activeChallenges={dashboardData.activeChallenges}
          recentSubmissions={dashboardData.recentSubmissions}
          translations={messages}
        />
      </Suspense>
    )
    
  } catch (error) {
    console.error("Dashboard error:", error)
    redirect("/auth/login")
  }
}
