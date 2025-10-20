import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Create OAuth user after role selection
 * Called from /auth/select-role page after user chooses their role
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supabaseUserId, email, name, image, role } = body

    if (!supabaseUserId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: supabaseUserId, email, role" },
        { status: 400 }
      )
    }

    if (!["CREATOR", "PARTICIPANT"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be CREATOR or PARTICIPANT" },
        { status: 400 }
      )
    }

    console.log("Creating OAuth user:", { supabaseUserId, email, role })

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { id: supabaseUserId },
    })

    if (user) {
      // User already exists, just update role if needed
      console.log("User already exists, updating role if needed")
      user = await prisma.user.update({
        where: { id: supabaseUserId },
        data: {
          role: role,
        },
        include: { accounts: true },
      })
    } else {
      // Create new user with selected role
      console.log("Creating new OAuth user with role:", role)
      user = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email,
          name: name || email.split("@")[0],
          image,
          role: role,
          accounts: {
            create: {
              type: "oauth",
              provider: "google",
              providerAccountId: supabaseUserId,
            },
          },
        },
        include: { accounts: true },
      })
    }

    console.log("✅ OAuth user created/updated successfully:", { id: user.id, email: user.email, role: user.role })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Error creating OAuth user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 500 }
    )
  }
}
