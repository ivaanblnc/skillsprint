import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("=== AUTH CALLBACK HANDLER STARTED ===")
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  
  console.log("Callback parameters:", { code: code?.substring(0, 10) + "...", next, origin })

  if (code) {
    const cookieStore = cookies()
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    console.log("Callback handler - exchanging code for session")
    console.log("Code received:", code)
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      console.log("Session established successfully for user:", data.user.email)
      console.log("User data:", {
        id: data.user.id,
        email: data.user.email,
        confirmed: data.user.email_confirmed_at
      })
      
      // Crear el usuario en la base de datos si no existe
      try {
        console.log("=== CREATING/UPDATING USER IN DATABASE ===")
        console.log("Attempting to import Prisma...")
        const { prisma } = await import("@/lib/prisma")
        console.log("✅ Prisma imported successfully")
        
        console.log("User data to save:", {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          role: data.user.user_metadata?.role?.toUpperCase() || "PARTICIPANT",
          metadata: data.user.user_metadata
        })
        
        console.log("Attempting upsert operation...")
        const dbUser = await prisma.user.upsert({
          where: { email: data.user.email! },
          update: {
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            role: data.user.user_metadata?.role?.toUpperCase() || "PARTICIPANT",
            updatedAt: new Date(),
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            role: data.user.user_metadata?.role?.toUpperCase() || "PARTICIPANT",
          },
        })
        
        console.log("✅ User created/updated in database successfully:", dbUser)
        console.log("=== DATABASE OPERATION COMPLETED ===")
      } catch (dbError) {
        console.error("❌ Database error:", dbError)
        console.error("Full error details:", JSON.stringify(dbError, null, 2))
        console.error("Error name:", dbError?.constructor?.name)
        console.error("Error message:", (dbError as any)?.message || 'No message available')
        // En caso de error de DB, redirigir a página de error específica
        return NextResponse.redirect(`${origin}/auth/verify-email?error=database_error&details=${encodeURIComponent((dbError as any)?.message || 'Unknown error')}`)
      }
      
      console.log("Redirecting to:", `${origin}${next}`)
      return response
    } else {
      console.error("Error establishing session:", error)
      console.error("Full error object:", JSON.stringify(error, null, 2))
    }
  }

  // En caso de error, redirigir a la página de verificación
  return NextResponse.redirect(`${origin}/auth/verify-email?error=callback_failed`)
}
