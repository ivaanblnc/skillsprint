import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { SubmissionStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is judge
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'JUDGE') {
      return NextResponse.json({ error: 'Forbidden - Judge access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get('challengeId')
    const status = searchParams.get('status') || 'PENDING'

    // Build where clause
    let whereClause: any = {
      status: status
    }

    if (challengeId) {
      whereClause.challengeId = challengeId
    }

    // Get submissions with related data
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
        challenge: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            points: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Format submissions data
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      challenge: {
        id: submission.challenge.id,
        title: submission.challenge.title,
        difficulty: submission.challenge.difficulty,
        points: submission.challenge.points
      },
      user: {
        id: submission.user.id,
        name: submission.user.name,
        email: submission.user.email,
        avatar: submission.user.image
      },
      code: submission.code,
      language: submission.language,
      status: submission.status,
      score: submission.score,
      submittedAt: submission.submittedAt,
      executionTime: submission.executionTime,
      memory: submission.memory,
      // Check if submission has a file (code starts with file path or is empty/null)
      hasFile: !submission.code || submission.code.startsWith('/') || submission.code.includes('.')
    }))

    return NextResponse.json({ submissions: formattedSubmissions })

  } catch (error) {
    console.error('Error fetching judge submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is judge
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'JUDGE') {
      return NextResponse.json({ error: 'Forbidden - Judge access required' }, { status: 403 })
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

    // Verify submission exists and is pending
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        challenge: {
          select: {
            points: true
          }
        }
      }
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (existingSubmission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Submission is not in pending status' }, { status: 400 })
    }

    // Determine new status and score  
    let newScore: number

    if (action === 'ACCEPT') {
      // Use provided score or default to challenge points
      newScore = score !== undefined ? score : existingSubmission.challenge.points
    } else {
      newScore = 0
    }

    // Update submission 
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: action === 'ACCEPT' ? SubmissionStatus.ACCEPTED : ('REJECTED' as any),
        score: newScore,
        reviewedAt: new Date(),
        reviewedById: user.id
      }
    })

    // Create feedback if provided
    if (feedback && feedback.trim()) {
      await prisma.feedback.create({
        data: {
          submissionId: submissionId,
          judgeId: user.id,
          comment: feedback.trim(),
          rating: action === 'ACCEPT' ? Math.ceil((newScore / existingSubmission.challenge.points) * 5) : 1 // Convert score to 1-5 rating
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
