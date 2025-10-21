/**
 * Profile Page - Refactorized with Clean Architecture
 * Server Component que maneja la lógica de datos del perfil
 */

export const dynamic = 'force-dynamic'

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { getMessages } from "@/lib/server-i18n"
import { createUserService } from "@/lib/services/user.service"
import { ProfileClient } from "./profile-client"
import { Suspense } from "react"
import { ProfileSkeleton } from "@/components/ui/profile-skeleton"

/**
 * Server Component principal del Profile
 * Maneja autenticación y carga de datos del usuario
 */
export default async function ProfilePage() {
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

    // Crear servicio de usuario y obtener datos
    const userService = createUserService(supabase)
    const [user, stats, recentActivity] = await Promise.all([
      userService.getUserProfile(authUser.id),
      userService.getUserStats(authUser.id),
      userService.getUserRecentActivity(authUser.id, 8)
    ])
    
    if (!user) {
      console.error("Failed to fetch user profile")
      redirect("/auth/login")
    }

    // Get translation
    const messages = await getMessages()

    return (
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileClient 
          user={user}
          authUser={authUser}
          stats={stats}
          recentActivity={recentActivity}
          translations={messages}
        />
      </Suspense>
    )
    
  } catch (error) {
    console.error("Profile error:", error)
    redirect("/auth/login")
  }
}
