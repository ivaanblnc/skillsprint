import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Listar todos los usuarios de Supabase Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verificar cuáles están en nuestra base de datos
    const usersWithDbStatus = await Promise.all(
      users.map(async (user) => {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        })
        
        return {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at,
          createdAt: user.created_at,
          metadata: user.user_metadata,
          inDatabase: !!dbUser
        }
      })
    )

    return NextResponse.json({ 
      users: usersWithDbStatus,
      totalSupabaseUsers: users.length,
      usersInDatabase: usersWithDbStatus.filter(u => u.inDatabase).length
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
