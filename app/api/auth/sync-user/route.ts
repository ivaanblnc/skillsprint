import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Obtener el usuario autenticado desde Supabase
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Syncing user with database:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    })

    // Sincronizar usuario con nuestra base de datos
    const dbUser = await prisma.user.upsert({
      where: { email: user.email! },
      update: {
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || "",
        image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || "",
        image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        role: (user.user_metadata?.role?.toUpperCase() as "CREATOR" | "PARTICIPANT" | "ADMIN") || "PARTICIPANT",
        points: 0,
      },
    })

    console.log('User synced successfully:', dbUser)

    return NextResponse.json({ 
      success: true,
      user: dbUser 
    })
    
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ 
      error: 'Failed to sync user', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
