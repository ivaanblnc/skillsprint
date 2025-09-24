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

    // Verify user exists and is a CREATOR
    const user = await prisma.user.findUnique({
      where: { id: userData.user.id },
      select: { id: true, role: true }
    })

    if (!user || user.role !== "CREATOR") {
      return NextResponse.json({ message: "Forbidden - Creator access required" }, { status: 403 })
    }

    // Verify the challenge exists and belongs to the user
    const challenge = await prisma.challenge.findUnique({
      where: { 
        id: params.id,
        creatorId: user.id
      }
    })

    if (!challenge) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 })
    }

    // Get all submissions for this challenge
    const submissions = await prisma.submission.findMany({
      where: { 
        challengeId: params.id,
        isDraft: false // Only show submitted (non-draft) submissions
      },
      orderBy: { submittedAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ submissions })

  } catch (error) {
    console.error("Error fetching challenge submissions:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
