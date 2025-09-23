import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token provided" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Establecer la sesión con el token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      console.error("Supabase auth error:", error)
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    console.log("User from Supabase:", {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
      confirmed: user.email_confirmed_at
    })

    // Upsert en Prisma con mejor manejo de errores
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

      console.log("User created/updated in database:", dbUser)
      return NextResponse.json({ success: true, user: dbUser })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Database error: " + (dbError instanceof Error ? dbError.message : 'Unknown error') },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error verifying user:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
