import { Analytics, Challenge } from '@/lib/types'

import { prisma } from '@/lib/prisma'

export class AnalyticsService {
  static async getChallengeAnalytics(challengeId: string, userId: string): Promise<{
    challenge: Challenge
    analytics: Analytics | null
  }> {
    try {
      // Fetch challenge details directly from database
      const challenge = await prisma.challenge.findUnique({
        where: { 
          id: challengeId,
          creatorId: userId // Ensure user owns the challenge
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          testCases: true,
          submissions: {
            select: {
              id: true,
              status: true,
              score: true,
              submittedAt: true,
              executionTime: true,
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
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

      if (!challenge) {
        throw new Error('Challenge not found or access denied')
      }

      // Calculate analytics from submissions
      const submissions = challenge.submissions
      const acceptedSubmissions = submissions.filter(s => s.status === 'ACCEPTED')
      
      const analytics: Analytics = {
        totalSubmissions: submissions.length,
        uniqueParticipants: new Set(submissions.map(s => s.user.id)).size,
        acceptedSubmissions: acceptedSubmissions.length,
        averageScore: submissions.length > 0 
          ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
          : 0,
        submissionsByDay: AnalyticsService.groupSubmissionsByDay(submissions),
        statusDistribution: AnalyticsService.calculateStatusDistribution(submissions),
        difficultyMetrics: {
          averageAttempts: submissions.length > 0 ? submissions.length / new Set(submissions.map(s => s.user.id)).size : 0,
          successRate: submissions.length > 0 ? (acceptedSubmissions.length / submissions.length) * 100 : 0
        }
      }

      return {
        challenge: challenge as Challenge,
        analytics
      }
    } catch (error) {
      console.error('Error fetching challenge analytics:', error)
      throw error
    }
  }

  static calculateSuccessRate(analytics: Analytics): number {
    if (analytics.totalSubmissions === 0) return 0
    return Math.round((analytics.acceptedSubmissions / analytics.totalSubmissions) * 100)
  }

  static calculateStatusPercentage(count: number, total: number): number {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  static getMaxSubmissionCount(submissionsByDay: { date: string; count: number }[]): number {
    if (submissionsByDay.length === 0) return 1
    return Math.max(...submissionsByDay.map(d => d.count))
  }

  static formatActivityPercentage(count: number, maxCount: number): number {
    if (maxCount === 0) return 0
    return Math.min((count / maxCount) * 100, 100)
  }

  static groupSubmissionsByDay(submissions: any[]): { date: string; count: number }[] {
    const groupedByDay = submissions.reduce((acc, submission) => {
      const date = new Date(submission.submittedAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(groupedByDay)
      .map(([date, count]) => ({ date, count: count as number }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  static calculateStatusDistribution(submissions: any[]): { status: string; count: number }[] {
    const statusCount = submissions.reduce((acc, submission) => {
      acc[submission.status] = (acc[submission.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCount).map(([status, count]) => ({ status, count: count as number }))
  }
}
