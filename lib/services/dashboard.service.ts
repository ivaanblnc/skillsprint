/**
 * Servicios de datos para el dashboard
 * Implementa repository pattern y separación de responsabilidades
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { User, Challenge, Submission, DashboardStats } from '@/lib/types'
import { prisma } from '@/lib/prisma'

export class DashboardService {
  constructor(private supabase: SupabaseClient) {}

  async getDashboardData(userId: string) {
    try {
      const [user, stats, activeChallenges, recentSubmissions] = await Promise.all([
        this.getUserData(userId),
        this.getUserStats(userId),
        this.getActiveChallenges(),
        this.getRecentSubmissions(userId)
      ])

      return {
        user,
        stats,
        activeChallenges,
        recentSubmissions
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw new Error('Failed to load dashboard data')
    }
  }

  private async getUserData(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        image: true,
        createdAt: true
      }
    })

    return user
  }

  private async getUserStats(userId: string): Promise<DashboardStats> {
    const [submissions, acceptedSubmissions] = await Promise.all([
      prisma.submission.count({
        where: { userId }
      }),
      prisma.submission.count({
        where: { 
          userId,
          status: 'ACCEPTED'
        }
      })
    ])

    const avgScoreResult = await prisma.submission.aggregate({
      where: { 
        userId,
        score: { not: null }
      },
      _avg: {
        score: true
      }
    })

    const userPointsResult = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    })

    return {
      totalPoints: userPointsResult?.points || 0,
      totalSubmissions: submissions,
      acceptedSubmissions,
      averageScore: Math.round(avgScoreResult._avg.score || 0)
    }
  }

  private async getActiveChallenges(): Promise<Challenge[]> {
    return await prisma.challenge.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        creator: {
          select: {
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })
  }

  private async getRecentSubmissions(userId: string): Promise<Submission[]> {
    return await prisma.submission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      include: {
        challenge: {
          select: {
            title: true,
            difficulty: true
          }
        }
      }
    })
  }
}

export const createDashboardService = (supabase: SupabaseClient) => {
  return new DashboardService(supabase)
}
