import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()

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

    const { data: testCases, error: testCasesError } = await supabase
      .from("test_cases")
      .select("*")
      .eq("challenge_id", challengeId)
      .eq("is_public", true)

    if (testCasesError) {
      return NextResponse.json({ error: "Failed to get test cases" }, { status: 500 })
    }

    // Simulate running tests
    const testResults = (testCases || []).map((testCase, index) => ({
      testCase: index + 1,
      input: testCase.input,
      expectedOutput: testCase.expected_output,
      actualOutput: testCase.expected_output, // Mock: assume correct output
      passed: Math.random() > 0.3, // Mock: 70% chance of passing
      executionTime: Math.floor(Math.random() * 100) + 10,
    }))

    return NextResponse.json({
      success: true,
      testResults,
    })
  } catch (error) {
    console.error("Test execution error:", error)
    return NextResponse.json({ error: "Failed to run tests" }, { status: 500 })
  }
}
