import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const submissionSchema = z.object({
  challengeId: z.string(),
  code: z.string().optional(),
  language: z.string(),
  isDraft: z.boolean().default(false),
  fileUrl: z.string().optional(),
})

// POST - Create a new submission or save as draft
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId, code, language, isDraft, fileUrl } = submissionSchema.parse(body)

    // Check if challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    if (challenge.status !== "ACTIVE" || new Date() > challenge.endDate) {
      return NextResponse.json({ error: "Challenge is not active" }, { status: 400 })
    }

    // Check if user already has a submission for this challenge
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: user.id
        }
      }
    })

    // If submitting final solution and already has a FINAL submission (isDraft is false), reject
    if (existingSubmission && !isDraft && !(existingSubmission as any).isDraft) {
      return NextResponse.json(
        { error: "You have already submitted a solution for this challenge" }, 
        { status: 400 }
      )
    }

    // If it's a draft, update existing submission or create new one
    if (isDraft) {
      if (existingSubmission) {
        const updatedSubmission = await prisma.submission.update({
          where: { id: existingSubmission.id },
          data: {
            code,
            language,
            fileUrl,
            submittedAt: new Date()
          }
        })

        return NextResponse.json({ 
          success: true, 
          submission: updatedSubmission,
          message: "Draft saved successfully"
        })
      } else {
        const newSubmission = await prisma.submission.create({
          data: {
            challengeId,
            userId: user.id,
            code,
            language,
            fileUrl,
            status: "PENDING",
            isDraft: true
          } as any
        })

        return NextResponse.json({ 
          success: true, 
          submission: newSubmission,
          message: "Draft saved successfully"
        })
      }
    }

    // For final submission
    let submission
    if (existingSubmission) {
      // Update the draft to final submission
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          code,
          language,
          fileUrl,
          status: "PENDING",
          isDraft: false,  // Mark as final submission
          submittedAt: new Date()
        } as any
      })
    } else {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          challengeId,
          userId: user.id,
          code,
          language,
          fileUrl,
          status: "PENDING",
          isDraft: false  // Final submission
        } as any
      })
    }

    // Final submissions should remain PENDING until a judge reviews them
    // No automatic scoring - judges will review and score manually
    
    return NextResponse.json({
      success: true,
      status: "PENDING",
      score: null,
      submission: submission,
      message: "Solution submitted successfully and is pending review"
    })

  } catch (error) {
    console.error("Error creating/updating submission:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// GET - Get user's submission for a specific challenge
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const challengeId = searchParams.get("challengeId")

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 })
    }

    const submission = await prisma.submission.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: user.id
        }
      },
      include: {
        challenge: {
          select: {
            title: true,
            difficulty: true,
            points: true
          }
        },
        reviewedBy: {
          select: {
            name: true,
            email: true
          }
        },
        feedbacks: {
          select: {
            comment: true,
            rating: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    return NextResponse.json({ submission })

  } catch (error) {
    console.error("Error fetching submission:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
