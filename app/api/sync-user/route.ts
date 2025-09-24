import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Syncing user:', user.id, user.email)

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists', 
        user: existingUser 
      })
    }

    // Get user metadata from Supabase
    const userData = user.user_metadata || {}
    const role = userData.role || 'participant'

    // Map roles correctly
    let prismaRole: Role = 'PARTICIPANT'
    if (role.toLowerCase() === 'creator') {
      prismaRole = 'CREATOR'
    } else if (role.toLowerCase() === 'admin') {
      prismaRole = 'ADMIN'
    }

    // Create user in our database
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: userData.name || userData.full_name || user.email,
        image: userData.avatar_url || userData.picture || null,
        role: prismaRole,
        emailVerified: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null
      }
    })

    console.log('User created successfully:', newUser)

    return NextResponse.json({ 
      message: 'User synced successfully',
      user: newUser
    })

  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
