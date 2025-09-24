import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: userData, error } = await supabase.auth.getUser()
    
    if (error || !userData?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Verify user exists and is a CREATOR
    const user = await prisma.user.findUnique({
      where: { id: userData.user.id },
      select: { id: true, role: true }
    })

    if (!user || user.role !== "CREATOR") {
      return NextResponse.json({ message: "Forbidden - Creator access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      difficulty,
      points,
      timeLimit,
      startDate,
      endDate,
      status,
      testCases
    } = body

    // Validate required fields
    if (!title || !description || !difficulty || !points || !timeLimit || !startDate || !endDate || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Validate difficulty
    if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      return NextResponse.json({ message: "Invalid difficulty level" }, { status: 400 })
    }

    // Validate status
    if (!["DRAFT", "ACTIVE"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (end <= start) {
      return NextResponse.json({ message: "End date must be after start date" }, { status: 400 })
    }

    // Validate test cases
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json({ message: "At least one test case is required" }, { status: 400 })
    }

    for (const testCase of testCases) {
      if (!testCase.input || !testCase.expectedOutput) {
        return NextResponse.json({ message: "All test cases must have input and expected output" }, { status: 400 })
      }
    }

    // Create the challenge with test cases in a transaction
    const challenge = await prisma.$transaction(async (tx) => {
      // Create the challenge
      const newChallenge = await tx.challenge.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          difficulty,
          points: parseInt(points),
          timeLimit: parseInt(timeLimit),
          startDate: start,
          endDate: end,
          status,
          creatorId: user.id,
        }
      })

      // Create test cases
      const testCaseData = testCases.map((testCase: any) => ({
        challengeId: newChallenge.id,
        input: testCase.input.trim(),
        expectedOutput: testCase.expectedOutput.trim(),
        isPublic: Boolean(testCase.isPublic)
      }))

      await tx.testCase.createMany({
        data: testCaseData
      })

      return newChallenge
    })

    return NextResponse.json({ 
      message: `Challenge ${status === "DRAFT" ? "saved as draft" : "published"} successfully`,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        status: challenge.status
      }
    })

  } catch (error) {
    console.error("Error creating challenge:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: userData, error } = await supabase.auth.getUser()
    
    if (error || !userData?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Verify user exists and is a CREATOR
    const user = await prisma.user.findUnique({
      where: { id: userData.user.id },
      select: { id: true, role: true }
    })

    if (!user || user.role !== "CREATOR") {
      return NextResponse.json({ message: "Forbidden - Creator access required" }, { status: 403 })
    }

    // Get creator's challenges
    const challenges = await prisma.challenge.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            submissions: true,
            testCases: true
          }
        }
      }
    })

    return NextResponse.json({ challenges })

  } catch (error) {
    console.error("Error fetching challenges:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
