import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const access_token = searchParams.get('access_token')
    const code = searchParams.get('code')
    
    console.log("Supabase callback received:", { access_token: !!access_token, code: !!code })
    
    // Si no hay token ni código, redirigir al login
    if (!access_token && !code) {
      console.log("No auth data, redirecting to login")
      return NextResponse.redirect(new URL('/auth/login?error=missing_auth_data', request.url))
    }

    const supabase = createClient()
    let user = null

    if (code) {
      // Intercambiar el código por una sesión
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/auth/login?error=code_exchange_failed', request.url))
      }
      user = data.user
    } else if (access_token) {
      // Usar el access token directamente
      const { data, error } = await supabase.auth.getUser(access_token)
      if (error) {
        console.error('Error getting user from token:', error)
        return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
      }
      user = data.user
    }

    if (!user) {
      console.error('No user found after auth')
      return NextResponse.redirect(new URL('/auth/login?error=no_user', request.url))
    }

    const metadata = user.user_metadata || {}

    console.log('Creating/updating user in database:', { 
      id: user.id, 
      email: user.email, 
      name: metadata.name, 
      role: metadata.role 
    })

    // Inserta o actualiza usuario en Prisma
    const dbUser = await prisma.user.upsert({
      where: { email: user.email! },
      update: {
        name: metadata.name || user.email || "",
        role: (metadata.role?.toUpperCase() as "CREATOR" | "PARTICIPANT" | "ADMIN") || "PARTICIPANT",
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email!,
        name: metadata.name || user.email || "",
        role: (metadata.role?.toUpperCase() as "CREATOR" | "PARTICIPANT" | "ADMIN") || "PARTICIPANT",
        points: 0,
      },
    })

    console.log('User created/updated in database:', dbUser)

    // Redirige a dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
    
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url))
  }
}
