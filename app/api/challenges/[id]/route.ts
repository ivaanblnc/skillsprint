import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET(
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

    const isCreator = user.role === "CREATOR"
    
    let challenge;
    
    if (isCreator) {
      // For creators, allow access to their own challenges (any status)
      challenge = await prisma.challenge.findUnique({
        where: { 
          id: params.id,
          creatorId: user.id // Creators can only see their own challenges
        },
        include: {
          testCases: {
            orderBy: { createdAt: "asc" }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              submissions: true,
              testCases: true
            }
          }
        }
      })
    } else {
      // For other users, only allow access to public challenges (ACTIVE or COMPLETED)
      challenge = await prisma.challenge.findFirst({
        where: {
          id: params.id,
          status: { in: ["ACTIVE", "COMPLETED"] }
        },
        include: {
          // For participants, only include public test cases (for examples/hints)
          testCases: {
            select: {
              id: true,
              input: true,
              expectedOutput: true,
              isPublic: true
            },
            where: { isPublic: true },
            orderBy: { createdAt: "asc" }
          },
          creator: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              submissions: true,
              testCases: true
            }
          }
        }
      })
    }

    if (!challenge) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 })
    }

    return NextResponse.json({ challenge })

  } catch (error) {
    console.error("Error fetching challenge:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify the challenge exists and belongs to the user
    const existingChallenge = await prisma.challenge.findUnique({
      where: { 
        id: params.id,
        creatorId: user.id
      }
    })

    if (!existingChallenge) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 })
    }

    const body = await request.json()
    const updateData: any = {}

    // Handle different update types
    if (body.status) {
      if (!["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"].includes(body.status)) {
        return NextResponse.json({ message: "Invalid status" }, { status: 400 })
      }
      updateData.status = body.status
    }

    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description.trim()
    if (body.difficulty !== undefined) {
      if (!["EASY", "MEDIUM", "HARD"].includes(body.difficulty)) {
        return NextResponse.json({ message: "Invalid difficulty" }, { status: 400 })
      }
      updateData.difficulty = body.difficulty
    }
    if (body.points !== undefined) updateData.points = parseInt(body.points)
    if (body.timeLimit !== undefined) updateData.timeLimit = parseInt(body.timeLimit)
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)

    const updatedChallenge = await prisma.challenge.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            submissions: true,
            testCases: true
          }
        }
      }
    })

    // Handle test cases updates if provided
    if (body.testCases && Array.isArray(body.testCases)) {
      // Delete existing test cases and create new ones
      await prisma.testCase.deleteMany({
        where: { challengeId: params.id }
      })

      const testCaseData = body.testCases.map((testCase: any) => ({
        challengeId: params.id,
        input: testCase.input.trim(),
        expectedOutput: testCase.expectedOutput.trim(),
        isPublic: Boolean(testCase.isPublic)
      }))

      await prisma.testCase.createMany({
        data: testCaseData
      })
    }

    return NextResponse.json({ 
      message: "Challenge updated successfully",
      challenge: updatedChallenge
    })

  } catch (error) {
    console.error("Error updating challenge:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify the challenge exists and belongs to the user
    const existingChallenge = await prisma.challenge.findUnique({
      where: { 
        id: params.id,
        creatorId: user.id
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!existingChallenge) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 })
    }

    // Prevent deletion if there are submissions (unless it's a draft)
    if (existingChallenge.status !== "DRAFT" && existingChallenge._count.submissions > 0) {
      return NextResponse.json({ 
        message: "Cannot delete challenge with existing submissions. Consider marking it as cancelled instead." 
      }, { status: 400 })
    }

    // Delete the challenge (cascade will handle test cases and submissions)
    await prisma.challenge.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Challenge deleted successfully" })

  } catch (error) {
    console.error("Error deleting challenge:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
