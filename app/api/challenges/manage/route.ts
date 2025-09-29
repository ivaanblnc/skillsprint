/**
 * API Route for Challenge Management
 * Handles fetching user challenges with search and pagination
 */

import { createServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createChallengeDetailService } from "@/lib/services/challenge-detail.service"

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 3
    const search = searchParams.get('search') || ''

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, error: "Invalid pagination parameters" },
        { status: 400 }
      )
    }

    // Get user challenges
    const challengeDetailService = createChallengeDetailService(supabase)
    const result = await challengeDetailService.getUserChallenges(user.id, page, limit, search)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error("Error in challenge manage API:", error)
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
