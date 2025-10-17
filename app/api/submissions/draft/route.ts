import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const draftSchema = z.object({
  challengeId: z.string(),
  userId: z.string(),
  code: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  submissionType: z.enum(['code', 'file']),
})

/**
 * POST - Save submission as draft
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId, userId, code, language, submissionType } = draftSchema.parse(body)

    // Verify user is saving their own draft
    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Check if user already has a submission (draft or final)
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: user.id
        }
      }
    })

    let submission

    if (existingSubmission) {
      // Update existing submission as draft
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          code: submissionType === 'code' ? (code || null) : existingSubmission.code,
          language: submissionType === 'code' ? (language || null) : existingSubmission.language,
          status: "PENDING",
          isDraft: true
        }
      })
    } else {
      // Create new submission as draft
      submission = await prisma.submission.create({
        data: {
          challengeId,
          userId: user.id,
          code: submissionType === 'code' ? (code || null) : null,
          language: submissionType === 'code' ? (language || null) : null,
          status: "PENDING",
          isDraft: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Draft saved successfully"
    })

  } catch (error) {
    console.error("Error saving draft:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
