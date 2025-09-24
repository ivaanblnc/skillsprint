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

    // Get all submissions for analytics
    const submissions = await prisma.submission.findMany({
      where: { 
        challengeId: params.id,
        isDraft: false
      },
      select: {
        id: true,
        status: true,
        score: true,
        submittedAt: true,
        userId: true
      }
    })

    // Calculate analytics
    const totalSubmissions = submissions.length
    const uniqueParticipants = new Set(submissions.map(s => s.userId)).size
    const acceptedSubmissions = submissions.filter(s => s.status === "ACCEPTED").length

    // Calculate average score
    const scoresWithValues = submissions.filter(s => s.score !== null)
    const averageScore = scoresWithValues.length > 0 
      ? scoresWithValues.reduce((sum, s) => sum + (s.score || 0), 0) / scoresWithValues.length
      : 0

    // Status distribution
    const statusCounts = submissions.reduce((acc, submission) => {
      acc[submission.status] = (acc[submission.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))

    // Submissions by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const submissionsByDay = submissions
      .filter(s => new Date(s.submittedAt) >= thirtyDaysAgo)
      .reduce((acc, submission) => {
        const date = new Date(submission.submittedAt).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const submissionsByDayArray = Object.entries(submissionsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate difficulty metrics
    const userSubmissionCounts = submissions.reduce((acc, submission) => {
      acc[submission.userId] = (acc[submission.userId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageAttempts = uniqueParticipants > 0 
      ? totalSubmissions / uniqueParticipants 
      : 0

    const successRate = uniqueParticipants > 0 
      ? (acceptedSubmissions / uniqueParticipants) * 100 
      : 0

    const analytics = {
      totalSubmissions,
      uniqueParticipants,
      acceptedSubmissions,
      averageScore,
      submissionsByDay: submissionsByDayArray,
      statusDistribution,
      difficultyMetrics: {
        averageAttempts,
        successRate
      }
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error("Error fetching challenge analytics:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
