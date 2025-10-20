/**
 * OAuth Authentication Service
 * Handles OAuth provider integration and user synchronization with Prisma
 * Scalable architecture for multiple OAuth providers
 */

import { prisma } from "@/lib/prisma"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export interface OAuthProviderData {
  provider: "google" | "github" | "microsoft"
  providerUserId: string
  email: string
  name?: string
  image?: string
  accessToken?: string
  refreshToken?: string
  supabaseUserId?: string  // Add Supabase user ID
  role?: "CREATOR" | "PARTICIPANT"  // Add optional role parameter
}

/**
 * Sync or create user from OAuth provider
 * Uses Prisma ORM for database operations
 * Returns or creates user record
 */
export async function syncOAuthUser(oauthData: OAuthProviderData) {
  try {
    const { provider, providerUserId, email, name, image, supabaseUserId, role } = oauthData

    // Check if user already exists by email
    let user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    })

    // If user exists, check if they have this OAuth provider linked
    if (user) {
      const existingAccount = user.accounts.find(
        (acc) => acc.provider === provider
      )

      if (!existingAccount) {
        // Link new OAuth provider to existing user
        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider,
            providerAccountId: providerUserId,
            access_token: oauthData.accessToken,
            refresh_token: oauthData.refreshToken,
          },
        })
      } else {
        // Update existing account tokens if provided
        if (oauthData.accessToken) {
          await prisma.account.update({
            where: {
              provider_providerAccountId: {
                provider,
                providerAccountId: providerUserId,
              },
            },
            data: {
              access_token: oauthData.accessToken,
              refresh_token: oauthData.refreshToken,
            },
          })
        }
      }

      return user
    }

    // Create new user from OAuth data
    const newUser = await prisma.user.create({
      data: {
        id: supabaseUserId,  // Use Supabase user ID for consistency
        email,
        name: name || email.split("@")[0], // Use part of email if name not provided
        image,
        role: role || undefined, // Use provided role, or undefined for new users to select later
        accounts: {
          create: {
            type: "oauth",
            provider,
            providerAccountId: providerUserId,
            access_token: oauthData.accessToken,
            refresh_token: oauthData.refreshToken,
          },
        },
      },
      include: { accounts: true },
    })

    return newUser
  } catch (error) {
    console.error("Error syncing OAuth user:", error)
    throw new Error(`Failed to sync OAuth user: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get OAuth provider info for a user
 * Check if user is using OAuth and which provider
 */
export async function getUserOAuthProvider(userId: string) {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        type: "oauth",
      },
    })

    return accounts.length > 0 ? accounts[0].provider : null
  } catch (error) {
    console.error("Error getting user OAuth provider:", error)
    return null
  }
}

/**
 * Check if user is OAuth-only (cannot change email)
 */
export async function isOAuthOnlyUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    })

    if (!user) return false

    // Check if user has only OAuth accounts (no password auth)
    const hasOAuthAccount = user.accounts.some((acc) => acc.type === "oauth")
    const hasPasswordAuth = user.accounts.some((acc) => acc.type === "password")

    // User is OAuth-only if they have OAuth but no password
    return hasOAuthAccount && !hasPasswordAuth
  } catch (error) {
    console.error("Error checking if user is OAuth-only:", error)
    return false
  }
}

/**
 * Get user's OAuth provider
 */
export async function getUserAuthProvider(
  userId: string
): Promise<"google" | "github" | "microsoft" | null> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        type: "oauth",
      },
    })

    return (account?.provider as "google" | "github" | "microsoft") || null
  } catch (error) {
    console.error("Error getting user auth provider:", error)
    return null
  }
}
