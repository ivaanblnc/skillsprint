import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { SubmissionStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the creator of the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      select: { 
        creatorId: true,
        title: true,
        points: true
      }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - Only challenge creator can view submissions' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build where clause
    let whereClause: any = {
      challengeId: params.id,
      isDraft: false // Only show submitted (non-draft) submissions
    }

    if (status && status !== 'ALL') {
      whereClause.status = status
    }

    // Fetch submissions with related data
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        feedbacks: {
          include: {
            creator: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Format submissions for frontend
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      challenge: {
        id: submission.challengeId,
        title: challenge.title,
        points: challenge.points
      },
      user: {
        id: submission.user.id,
        name: submission.user.name,
        email: submission.user.email,
        avatar: submission.user.image
      },
      code: submission.code,
      language: submission.language,
      fileUrl: submission.fileUrl,
      status: submission.status,
      score: submission.score,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      executionTime: submission.executionTime,
      memory: submission.memory,
      // Check if submission has a file
      hasFile: !!submission.fileUrl || (!submission.code || submission.code.startsWith('/') || submission.code.includes('.')),
      feedbacks: submission.feedbacks.map(feedback => ({
        id: feedback.id,
        comment: feedback.comment,
        rating: feedback.rating,
        createdAt: feedback.createdAt,
        creator: feedback.creator.name
      }))
    }))

    return NextResponse.json({ submissions: formattedSubmissions })

  } catch (error) {
    console.error('Error fetching challenge submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the creator of the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      select: { 
        creatorId: true,
        points: true
      }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - Only challenge creator can review submissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { submissionId, action, score, feedback } = body

    if (!submissionId || !action) {
      return NextResponse.json({ error: 'Missing required fields: submissionId and action' }, { status: 400 })
    }

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be ACCEPT or REJECT' }, { status: 400 })
    }

    // Verify submission exists and belongs to this challenge
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        challenge: {
          select: {
            id: true,
            points: true
          }
        }
      }
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (existingSubmission.challengeId !== params.id) {
      return NextResponse.json({ error: 'Submission does not belong to this challenge' }, { status: 400 })
    }

    if (existingSubmission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Submission is not in pending status' }, { status: 400 })
    }

    // Determine new status and score  
    let newScore: number

    if (action === 'ACCEPT') {
      // Use provided score or default to challenge points
      newScore = score !== undefined ? Math.max(0, Math.min(score, challenge.points)) : challenge.points
    } else {
      newScore = 0
    }

    // Update submission 
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: action === 'ACCEPT' ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
        score: newScore,
        reviewedAt: new Date(),
        reviewedById: user.id
      }
    })

    // Update user points if submission is accepted
    if (action === 'ACCEPT' && newScore > 0) {
      await prisma.user.update({
        where: { id: existingSubmission.userId },
        data: {
          points: {
            increment: newScore
          }
        }
      })
    }

    // Create feedback if provided
    if (feedback && feedback.trim()) {
      await prisma.feedback.create({
        data: {
          submissionId: submissionId,
          creatorId: user.id, // Creator acts as evaluator now
          comment: feedback.trim(),
          rating: action === 'ACCEPT' ? Math.ceil((newScore / challenge.points) * 5) : 1 // Convert score to 1-5 rating
        }
      })
    }

    return NextResponse.json({ 
      message: `Submission ${action.toLowerCase()}ed successfully`,
      success: true
    })

  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
