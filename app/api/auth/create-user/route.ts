import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Obtener el usuario autenticado
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    console.log('Creating user in database:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    })

    // Crear usuario en la base de datos
    const dbUser = await prisma.user.upsert({
      where: { email: user.email! },
      update: {
        name: user.user_metadata?.name || user.email || "",
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email || "",
        role: (user.user_metadata?.role?.toUpperCase() as "CREATOR" | "PARTICIPANT" | "ADMIN") || "PARTICIPANT",
        points: 0,
      },
    })

    return NextResponse.json({ 
      message: 'User created successfully', 
      user: dbUser 
    })
    
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ 
      error: 'Failed to create user', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
