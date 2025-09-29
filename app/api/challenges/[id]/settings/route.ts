import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from '@/lib/prisma'

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
    
    // Validate settings data
    const updateData: any = {}
    
    if (body.allowHints !== undefined) updateData.allowHints = Boolean(body.allowHints)
    if (body.allowDiscussion !== undefined) updateData.allowDiscussion = Boolean(body.allowDiscussion)
    if (body.allowCollaboration !== undefined) updateData.allowCollaboration = Boolean(body.allowCollaboration)
    if (body.maxAttempts !== undefined) updateData.maxAttempts = parseInt(body.maxAttempts) || 0
    if (body.showLeaderboard !== undefined) updateData.showLeaderboard = Boolean(body.showLeaderboard)
    if (body.allowLateSubmissions !== undefined) updateData.allowLateSubmissions = Boolean(body.allowLateSubmissions)
    if (body.autoGrade !== undefined) updateData.autoGrade = Boolean(body.autoGrade)
    if (body.requireApproval !== undefined) updateData.requireApproval = Boolean(body.requireApproval)
    if (body.customInstructions !== undefined) updateData.customInstructions = body.customInstructions.trim()
    if (body.tags !== undefined && Array.isArray(body.tags)) updateData.tags = body.tags
    if (body.status !== undefined) {
      if (!["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"].includes(body.status)) {
        return NextResponse.json({ message: "Invalid status" }, { status: 400 })
      }
      updateData.status = body.status
    }
    if (body.visibility !== undefined) {
      if (!["PUBLIC", "PRIVATE", "INVITE_ONLY"].includes(body.visibility)) {
        return NextResponse.json({ message: "Invalid visibility setting" }, { status: 400 })
      }
      updateData.visibility = body.visibility
    }

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

    return NextResponse.json({ 
      message: "Challenge settings updated successfully",
      challenge: updatedChallenge
    })

  } catch (error) {
    console.error("Error updating challenge settings:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
