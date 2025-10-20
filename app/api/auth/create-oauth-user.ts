import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { syncOAuthUser } from "@/lib/services/auth-oauth.service"

export async function POST(request: NextRequest) {
  try {
    const { supabaseUserId, email, name, image, role } = await request.json()

    if (!supabaseUserId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: supabaseUserId, email, and role" },
        { status: 400 }
      )
    }

    // Validate role
    if (!["CREATOR", "PARTICIPANT"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'CREATOR' or 'PARTICIPANT'" },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const cookieStore = cookies()
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
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify the user is creating their own profile
    if (user.id !== supabaseUserId) {
      return NextResponse.json(
        { error: "Cannot create profile for another user" },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          error: "User already exists",
          user: existingUser 
        },
        { status: 400 }
      )
    }

    // Create user in database with chosen role
    const newUser = await prisma.user.create({
      data: {
        id: supabaseUserId,
        email,
        name: name || email.split("@")[0],
        image,
        role, // Use the role selected by user
        // Create the OAuth account link
        accounts: {
          create: {
            type: "oauth",
            provider: "google",
            providerAccountId: user.id, // Use Supabase user ID as provider account ID
            access_token: user.user_metadata?.access_token,
            refresh_token: user.user_metadata?.refresh_token,
          },
        },
      },
      include: { accounts: true },
    })

    console.log("✅ OAuth user created successfully:", {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      provider: "google",
    })

    return NextResponse.json({
      success: true,
      message: "User profile created successfully",
      user: newUser,
    })
  } catch (error) {
    console.error("Error creating OAuth user:", error)
    return NextResponse.json(
      { error: "Failed to create user profile" },
      { status: 500 }
    )
  }
}
