import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    console.log("=== VERIFY CODE API ===")
    console.log("Received code:", code)

    if (!code) {
      console.log("ERROR: No code provided")
      return NextResponse.json(
        { error: "No verification code provided" },
        { status: 400 }
      )
    }

    // Crear el cliente de Supabase con cookies para establecer la sesión
    const cookieStore = cookies()
    const response = NextResponse.json({ success: true })

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

    console.log("Exchanging code for session...")

    // Intercambiar el código por una sesión
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.json(
        { error: "Invalid or expired verification code: " + error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      console.error("No user returned from session exchange")
      return NextResponse.json(
        { error: "No user found" },
        { status: 400 }
      )
    }

    console.log("Session established successfully for user:", data.user.email)

    // Crear el usuario en nuestra base de datos
    const user = data.user
    try {
      const dbUser = await prisma.user.upsert({
        where: { email: user.email! },
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

      console.log("User created in database:", dbUser)
      
      return NextResponse.json({ 
        success: true, 
        user: dbUser,
        session: data.session,
        message: "User verified and session established successfully"
      }, { 
        status: 200,
        headers: response.headers
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Database error: " + (dbError instanceof Error ? dbError.message : 'Unknown error') },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("=== VERIFY CODE ERROR ===", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
