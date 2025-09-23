import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { challengeId, code, language } = await req.json()

    if (!challengeId || !code || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    if (challenge.status !== "ACTIVE" || new Date() > new Date(challenge.end_date)) {
      return NextResponse.json({ error: "Challenge is not active" }, { status: 400 })
    }

    const { data: existingSubmission } = await supabase
      .from("submissions")
      .select("*")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .single()

    if (existingSubmission) {
      return NextResponse.json({ error: "You have already submitted a solution" }, { status: 400 })
    }

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        code,
        language,
        status: "PENDING",
      })
      .select()
      .single()

    if (submissionError) {
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
    }

    // Simulate code execution and scoring
    const mockScore = Math.floor(Math.random() * 40) + 60
    const mockStatus = mockScore >= 80 ? "ACCEPTED" : mockScore >= 60 ? "WRONG_ANSWER" : "RUNTIME_ERROR"

    const { data: updatedSubmission, error: updateError } = await supabase
      .from("submissions")
      .update({
        status: mockStatus,
        score: mockScore,
        execution_time: Math.floor(Math.random() * 1000) + 100,
        memory: Math.floor(Math.random() * 1000) + 500,
      })
      .eq("id", submission.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    if (mockStatus === "ACCEPTED") {
      await supabase.rpc("increment_user_points", {
        user_id: user.id,
        points_to_add: challenge.points,
      })
    }

    return NextResponse.json({
      success: true,
      status: mockStatus,
      score: mockScore,
      submission: updatedSubmission,
    })
  } catch (error) {
    console.error("Submission error:", error)
    return NextResponse.json({ error: "Failed to submit solution" }, { status: 500 })
  }
}
