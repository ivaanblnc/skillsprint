import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's submissions with challenge data
    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            points: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    // Calculate statistics
    const totalSubmissions = submissions.length
    const acceptedSubmissions = submissions.filter(s => s.status === 'ACCEPTED').length
    const totalChallengesCompleted = new Set(
      submissions.filter(s => s.status === 'ACCEPTED').map(s => s.challengeId)
    ).size

    // For pending submissions, we can count unique challenges attempted
    const totalChallengesAttempted = new Set(submissions.map(s => s.challengeId)).size

    // Calculate average score (only for submissions with scores)
    const submissionsWithScores = submissions.filter(s => s.score !== null)
    const averageScore = submissionsWithScores.length > 0 
      ? Math.round(submissionsWithScores.reduce((sum, s) => sum + (s.score || 0), 0) / submissionsWithScores.length)
      : 0

    // Get user's rank (simplified - count users with more points)
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { points: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const usersWithMorePoints = await prisma.user.count({
      where: { points: { gt: currentUser.points } }
    })

    const totalUsers = await prisma.user.count()
    const rank = usersWithMorePoints + 1

    // Get recent activity (last 10 submissions)
    const recentActivity = await prisma.submission.findMany({
      where: { userId: user.id },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            points: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 10
    })

    // Format recent activity
    const formattedActivity = recentActivity.map(submission => {
      const isAccepted = submission.status === 'ACCEPTED'
      const isPending = submission.status === 'PENDING'
      const isWrongAnswer = submission.status === 'WRONG_ANSWER'
      const timeAgo = getTimeAgo(submission.submittedAt)
      
      let title, description, color, type
      
      if (isAccepted) {
        title = `Solved "${submission.challenge.title}"`
        description = `Earned ${submission.challenge.points} points`
        color = 'green'
        type = 'solved'
      } else if (isPending) {
        title = `Submitted "${submission.challenge.title}"`
        description = 'Awaiting review'
        color = 'yellow'
        type = 'pending'
      } else if (isWrongAnswer) {
        title = `Attempted "${submission.challenge.title}"`
        description = `Score: ${submission.score || 0}/100`
        color = 'red'
        type = 'attempted'
      } else {
        title = `Attempted "${submission.challenge.title}"`
        description = `Score: ${submission.score || 0}/100`
        color = 'blue'
        type = 'attempted'
      }
      
      return {
        id: submission.id,
        type,
        title,
        description,
        timeAgo,
        color
      }
    })

    // Get user creation date for "joined" activity
    const userCreationDate = await prisma.user.findUnique({
      where: { id: user.id },
      select: { createdAt: true }
    })

    // Add "Joined SkillSprint" activity
    const userJoinedActivity = {
      id: 'joined',
      type: 'joined',
      title: 'Joined SkillSprint',
      description: 'Welcome to the community!',
      timeAgo: userCreationDate ? getTimeAgo(userCreationDate.createdAt) : 'Recently',
      color: 'purple'
    }

    const stats = {
      totalSubmissions,
      acceptedSubmissions,
      totalChallengesCompleted,
      totalChallengesAttempted,
      averageScore,
      rank,
      totalUsers,
      recentActivity: [...formattedActivity, userJoinedActivity]
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return diffInMinutes <= 1 ? 'just now' : `${diffInMinutes} minutes ago`
    }
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`
  } else if (diffInDays === 1) {
    return '1 day ago'
  } else if (diffInDays < 30) {
    return `${diffInDays} days ago`
  } else if (diffInDays < 365) {
    const diffInMonths = Math.floor(diffInDays / 30)
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`
  } else {
    const diffInYears = Math.floor(diffInDays / 365)
    return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`
  }
}
