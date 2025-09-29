import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: userData, error } = await supabase.auth.getUser()
    
    if (error || !userData?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userData.user.id },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Verify challenge exists and is active
    const challenge = await prisma.challenge.findFirst({
      where: {
        id: params.id,
        status: 'ACTIVE'
      },
      include: {
        testCases: {
          where: { isPublic: true }, // Only test against public test cases
          select: {
            input: true,
            expectedOutput: true
          }
        }
      }
    })

    if (!challenge) {
      return NextResponse.json({ message: "Challenge not found or not active" }, { status: 404 })
    }

    const body = await request.json()
    const { code, language } = body

    if (!code?.trim()) {
      return NextResponse.json({ message: "Code is required" }, { status: 400 })
    }

    if (!language) {
      return NextResponse.json({ message: "Language is required" }, { status: 400 })
    }

    // Here you would implement the actual code testing logic
    // For now, we'll simulate testing against public test cases
    const testResults = {
      success: true,
      passedTests: challenge.testCases.length,
      totalTests: challenge.testCases.length,
      results: challenge.testCases.map((testCase, index) => ({
        testCase: index + 1,
        passed: true, // Simulated result
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: testCase.expectedOutput, // Simulated
        executionTime: Math.floor(Math.random() * 100) + 10 // Random execution time
      }))
    }

    return NextResponse.json(testResults)

  } catch (error) {
    console.error("Error testing code:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
