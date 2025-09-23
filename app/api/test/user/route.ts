import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual (si está autenticado)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 })
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at,
        createdAt: user.created_at,
        metadata: user.user_metadata
      }
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
