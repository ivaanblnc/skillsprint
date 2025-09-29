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
    console.log("Received request body:", JSON.stringify(body, null, 2))
    
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

    // Validate required fields with detailed logging
    const missingFields = []
    if (!title) missingFields.push('title')
    if (!description) missingFields.push('description')
    if (!difficulty) missingFields.push('difficulty')
    if (!points) missingFields.push('points')
    if (!timeLimit) missingFields.push('timeLimit')
    if (!startDate) missingFields.push('startDate')
    if (!endDate) missingFields.push('endDate')
    if (!status) missingFields.push('status')
    
    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields)
      return NextResponse.json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }

    // Validate difficulty
    if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      console.log("Invalid difficulty:", difficulty)
      return NextResponse.json({ message: "Invalid difficulty level" }, { status: 400 })
    }

    // Validate status
    if (!["DRAFT", "ACTIVE"].includes(status)) {
      console.log("Invalid status:", status)
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    // Validate numeric fields
    const pointsNum = Number(points)
    const timeLimitNum = Number(timeLimit)
    
    if (isNaN(pointsNum) || pointsNum <= 0) {
      console.log("Invalid points:", points, "parsed as:", pointsNum)
      return NextResponse.json({ message: "Points must be a positive number" }, { status: 400 })
    }
    
    if (isNaN(timeLimitNum) || timeLimitNum <= 0) {
      console.log("Invalid timeLimit:", timeLimit, "parsed as:", timeLimitNum)
      return NextResponse.json({ message: "Time limit must be a positive number" }, { status: 400 })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime())) {
      console.log("Invalid start date:", startDate)
      return NextResponse.json({ message: "Invalid start date" }, { status: 400 })
    }
    
    if (isNaN(end.getTime())) {
      console.log("Invalid end date:", endDate)
      return NextResponse.json({ message: "Invalid end date" }, { status: 400 })
    }
    
    if (end <= start) {
      console.log("End date must be after start date. Start:", start, "End:", end)
      return NextResponse.json({ message: "End date must be after start date" }, { status: 400 })
    }

    // Validate test cases
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      console.log("Invalid test cases:", testCases)
      return NextResponse.json({ message: "At least one test case is required" }, { status: 400 })
    }

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      if (!testCase.input || typeof testCase.input !== 'string' || !testCase.input.trim()) {
        console.log(`Test case ${i + 1} missing input:`, testCase)
        return NextResponse.json({ 
          message: `Test case ${i + 1} must have input` 
        }, { status: 400 })
      }
      if (!testCase.expectedOutput || typeof testCase.expectedOutput !== 'string' || !testCase.expectedOutput.trim()) {
        console.log(`Test case ${i + 1} missing expected output:`, testCase)
        return NextResponse.json({ 
          message: `Test case ${i + 1} must have expected output` 
        }, { status: 400 })
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
          points: pointsNum,
          timeLimit: timeLimitNum,
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
