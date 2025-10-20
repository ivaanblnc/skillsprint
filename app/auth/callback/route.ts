import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { syncOAuthUser } from "@/lib/services/auth-oauth.service"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// Función para mapear roles del frontend a los valores de la base de datos
function mapRole(role: string): "CREATOR" | "PARTICIPANT" {
  const normalizedRole = role?.toUpperCase()
  switch (normalizedRole) {
    case "CREATOR":
    case "ORGANIZER":
      return "CREATOR"
    case "PARTICIPANT":
    default:
      return "PARTICIPANT"
  }
}

export async function GET(request: NextRequest) {
  console.log("=== AUTH CALLBACK HANDLER STARTED ===")
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const roleParam = searchParams.get("role") as "CREATOR" | "PARTICIPANT" | undefined
  
  console.log("Callback parameters:", { code: code?.substring(0, 10) + "...", next, origin, role: roleParam })

  if (code) {
    const cookieStore = cookies()
    // Create a temporary response for cookie setting - we'll update it based on OAuth type
    let response = NextResponse.redirect(`${origin}${next}`)

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
        
        const supabaseUser = data.user
        
        // Check if this is a Google OAuth login
        const googleIdentity = supabaseUser.identities?.find(
          (id) => id.provider === "google"
        )

        if (googleIdentity) {
          // Handle Google OAuth user
          console.log("Google OAuth detected, checking if user exists...")
          console.log("Email to check:", supabaseUser.email)
          console.log("Supabase ID:", supabaseUser.id)
          
          // Check if user exists BEFORE OAuth sync
          // Search by email first (since user might have logged in before with different Supabase ID)
          let existingUser = null
          try {
            existingUser = await prisma.user.findUnique({
              where: { email: supabaseUser.email! },
            })
            console.log("Prisma query result for email lookup:", existingUser)
          } catch (queryError) {
            console.error("Error querying user by email:", queryError)
          }

          const isNewUser = existingUser === null
          console.log("User existence check result:", { 
            isNewUser, 
            supabaseId: supabaseUser.id,
            email: supabaseUser.email,
            existingUserId: existingUser?.id || "NO USER",
            existingUserRole: existingUser?.role || "N/A",
            queryWasNull: existingUser === null
          })
          
          if (isNewUser) {
            // For new OAuth users, create with role: null
            // User will select role after redirect to dashboard
            console.log("✅✅✅ NEW GOOGLE USER - Creating with role: null, will select on dashboard...")
            console.log("About to create user with:", {
              id: supabaseUser.id,
              email: supabaseUser.email,
              role: "null (will be set after creation)"
            })
            
            // Create user without role field, then update to set role to null
            // This ensures role is NULL in database, not using default value
            const newUser = await prisma.user.create({
              data: {
                id: supabaseUser.id,
                email: supabaseUser.email || "",
                name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User",
                image: supabaseUser.user_metadata?.avatar_url,
                role: undefined, // IMPORTANT: Force role to undefined for new OAuth users (so they select role on dashboard)
                accounts: {
                  create: {
                    type: "oauth",
                    provider: "google",
                    providerAccountId: googleIdentity.id,
                    access_token: data.session?.access_token,
                    refresh_token: data.session?.refresh_token,
                  },
                },
              },
              include: { accounts: true },
            })
            
            console.log("✅ New OAuth user created successfully:", { 
              id: newUser.id, 
              email: newUser.email,
              role: newUser.role
            })
          } else {
            // For existing OAuth users, update their Supabase ID and sync tokens
            console.log("✅ EXISTING GOOGLE USER - User already exists, updating Supabase ID and syncing tokens...")
            
            // Update user's Supabase ID if it changed
            if (existingUser!.id !== supabaseUser.id) {
              console.log("Updating Supabase ID from", existingUser!.id, "to", supabaseUser.id)
              
              // We can't directly change the ID since it's a primary key
              // Instead, we'll just create/update the OAuth account link
            }
            
            // Check if OAuth account exists
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser!.id,
                provider: "google",
              },
            })

            if (!existingAccount) {
              // First time linking Google OAuth to this user - reset role if they have one
              // so they have to select role again through the OAuth flow
              if (existingUser!.role) {
                console.log("First-time OAuth link detected. User has existing role:", existingUser!.role, "- resetting to null for role selection")
                await prisma.user.update({
                  where: { id: existingUser!.id },
                  data: { role: null as any }, // Force reset to null only on first OAuth link
                })
              }
              
              // Create new OAuth account link
              await prisma.account.create({
                data: {
                  userId: existingUser!.id,
                  type: "oauth",
                  provider: "google",
                  providerAccountId: googleIdentity.id,
                  access_token: data.session?.access_token,
                  refresh_token: data.session?.refresh_token,
                },
              })
              console.log("Created new OAuth account link for existing user")
            } else {
              // OAuth account already exists, just update tokens (don't touch role)
              await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                  access_token: data.session?.access_token,
                  refresh_token: data.session?.refresh_token,
                },
              })
              console.log("Updated OAuth tokens for existing account (role unchanged)")
            }
            
            console.log("✅ Google OAuth user synced successfully")
          }
        } else {
          // Handle regular email/password login
          console.log("Regular email login detected, updating user...")
          
          const mappedRole = mapRole(supabaseUser.user_metadata?.role || 'participant')
          
          console.log("User data to save:", {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            originalRole: supabaseUser.user_metadata?.role,
            mappedRole: mappedRole,
          })
          
          const dbUser = await prisma.user.upsert({
            where: { email: supabaseUser.email! },
            update: {
              name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
              role: mappedRole,
              updatedAt: new Date(),
            },
            create: {
              id: supabaseUser.id,
              email: supabaseUser.email!,
              name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
              role: mappedRole,
            },
          })
          
          console.log("✅ User created/updated in database successfully:", dbUser)
        }
        
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
