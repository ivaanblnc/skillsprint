import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    console.log("Received verification code:", code)

    if (!code) {
      return NextResponse.json(
        { error: "No verification code provided" },
        { status: 400 }
      )
    }

    // Usar el service role client para obtener información del usuario
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log("Attempting to verify OTP...")
    
    // Verificar el código directamente
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: code,
      type: 'email'
    })

    console.log("Verify OTP result:", { 
      hasData: !!data, 
      hasSession: !!data?.session, 
      hasUser: !!data?.user, 
      error: error?.message 
    })

    if (error || !data.user) {
      console.error("Error verifying OTP:", error)
      return NextResponse.json(
        { error: "Invalid or expired verification code", details: error?.message },
        { status: 401 }
      )
    }

    const user = data.user
    console.log("User from OTP verification:", {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
      confirmed: user.email_confirmed_at
    })

    // Crear/actualizar usuario en la base de datos
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
      
      return NextResponse.json({ 
        success: true, 
        user: dbUser
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Database error: " + (dbError instanceof Error ? dbError.message : 'Unknown error') },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error verifying code:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
