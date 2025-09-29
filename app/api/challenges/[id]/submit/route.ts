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
          select: {
            input: true,
            expectedOutput: true,
            isPublic: true
          }
        }
      }
    })

    if (!challenge) {
      return NextResponse.json({ message: "Challenge not found or not active" }, { status: 404 })
    }

    // Check if challenge is within time limits
    const now = new Date()
    if (challenge.endDate && now > challenge.endDate) {
      return NextResponse.json({ message: "Challenge has ended" }, { status: 400 })
    }

    if (challenge.startDate && now < challenge.startDate) {
      return NextResponse.json({ message: "Challenge has not started yet" }, { status: 400 })
    }

    const body = await request.json()
    const { code, language } = body

    if (!code?.trim()) {
      return NextResponse.json({ message: "Code is required" }, { status: 400 })
    }

    if (!language) {
      return NextResponse.json({ message: "Language is required" }, { status: 400 })
    }

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        challengeId: params.id,
        code: code.trim(),
        language,
        status: 'PENDING',
        submittedAt: now
      }
    })

    // Here you would implement the actual code execution and testing logic
    // For now, we'll simulate the grading process
    const simulatedScore = Math.floor(Math.random() * 101) // Random score 0-100
    const simulatedStatus = simulatedScore >= 70 ? 'ACCEPTED' : 'WRONG_ANSWER'
    
    // Update submission with results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: simulatedStatus,
        score: simulatedScore,
        executionTime: Math.floor(Math.random() * 1000) + 100 // Random execution time
        // In a real implementation, you'd also store test results, compiler output, etc.
      }
    })

    return NextResponse.json({ 
      submission: updatedSubmission,
      message: "Code submitted successfully" 
    })

  } catch (error) {
    console.error("Error submitting code:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
