import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener todos los usuarios confirmados de Supabase
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filtrar solo usuarios confirmados
    const confirmedUsers = users.filter(user => user.email_confirmed_at)
    
    let syncedCount = 0
    const results = []

    for (const user of confirmedUsers) {
      try {
        // Intentar crear el usuario en nuestra base de datos
        const dbUser = await prisma.user.upsert({
          where: { id: user.id },
          update: {
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: user.user_metadata?.role?.toUpperCase() || "PARTICIPANT",
            updatedAt: new Date(),
          },
          create: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: user.user_metadata?.role?.toUpperCase() || "PARTICIPANT",
          },
        })
        
        syncedCount++
        results.push({
          email: user.email,
          status: 'synced',
          dbUser: dbUser
        })
      } catch (error) {
        console.error(`Error syncing user ${user.email}:`, error)
        results.push({
          email: user.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({ 
      message: `Synced ${syncedCount} users successfully`,
      totalConfirmedUsers: confirmedUsers.length,
      results
    })
  } catch (error) {
    console.error("Error syncing users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
