/**
 * Servicio para manejo del leaderboard
 * Gestiona estadísticas y rankings de usuarios
 */

import { prisma } from '@/lib/prisma'

export interface LeaderboardUser {
  id: string
  name: string | null
  email: string
  points: number
  role: string
  image?: string | null
  totalSubmissions: number
  acceptedSubmissions: number
  successRate: number
  rank: number
}

export interface GlobalStats {
  totalUsers: number
  totalChallenges: number
  totalSubmissions: number
  activeUsers: number
}

export class LeaderboardService {
  async getLeaderboard(limit: number = 50): Promise<LeaderboardUser[]> {
    try {
      // Get top users with their submission stats
      const users = await prisma.user.findMany({
        orderBy: { points: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          points: true,
          role: true,
          image: true,
          _count: {
            select: {
              submissions: true
            }
          }
        }
      })

      // Get detailed submission stats for each user
      const leaderboardData: LeaderboardUser[] = []
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        
        // Get accepted submissions count
        const acceptedSubmissions = await prisma.submission.count({
          where: {
            userId: user.id,
            status: 'ACCEPTED'
          }
        })

        const totalSubmissions = user._count.submissions
        const successRate = totalSubmissions > 0 
          ? Math.round((acceptedSubmissions / totalSubmissions) * 100) 
          : 0

        leaderboardData.push({
          id: user.id,
          name: user.name,
          email: user.email,
          points: user.points,
          role: user.role,
          image: user.image,
          totalSubmissions,
          acceptedSubmissions,
          successRate,
          rank: i + 1
        })
      }

      return leaderboardData
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      return []
    }
  }

  async getGlobalStats(): Promise<GlobalStats> {
    try {
      const [totalUsers, totalChallenges, totalSubmissions, activeUsers] = await Promise.all([
        prisma.user.count(),
        prisma.challenge.count({
          where: { status: 'ACTIVE' }
        }),
        prisma.submission.count(),
        // Active users (users with submissions in last 30 days)
        prisma.user.count({
          where: {
            submissions: {
              some: {
                submittedAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        })
      ])

      return {
        totalUsers,
        totalChallenges,
        totalSubmissions,
        activeUsers
      }
      
    } catch (error) {
      console.error('Error fetching global stats:', error)
      return {
        totalUsers: 0,
        totalChallenges: 0,
        totalSubmissions: 0,
        activeUsers: 0
      }
    }
  }

  async getUserRank(userId: string): Promise<number> {
    try {
      const userPoints = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      })

      if (!userPoints) return 0

      const rank = await prisma.user.count({
        where: {
          points: {
            gt: userPoints.points
          }
        }
      })

      return rank + 1
      
    } catch (error) {
      console.error('Error fetching user rank:', error)
      return 0
    }
  }
}

export const createLeaderboardService = () => {
  return new LeaderboardService()
}
