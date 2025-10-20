import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * Update user role
 * Called when user selects their role during onboarding
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Create Supabase client to verify auth
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
              // Update cookies in response
            })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role || !["CREATOR", "PARTICIPANT"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be CREATOR or PARTICIPANT" },
        { status: 400 }
      )
    }

    console.log(`Updating user ${user.id} role to ${role}`)

    // Update user role in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: role,
      },
    })

    console.log(`✅ User role updated successfully:`, { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update role" },
      { status: 500 }
    )
  }
}
