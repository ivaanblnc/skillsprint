/**
 * Servicio para manejo de usuarios y perfiles
 * Gestiona operaciones relacionadas con usuarios
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { User, UserStats, ProfileFormData, ApiResponse } from '@/lib/types'
import { prisma } from '@/lib/prisma'

export class UserService {
  constructor(private supabase: SupabaseClient) {}

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          points: true,
          image: true,
          createdAt: true,
          accounts: {
            select: {
              provider: true,
              type: true
            }
          }
        }
      })

      return user as any
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const [
        submissions,
        acceptedSubmissions,
        challengesAttempted,
        challengesCompleted,
        avgScoreResult,
        userRankResult,
        totalUsers
      ] = await Promise.all([
        // Total submissions
        prisma.submission.count({
          where: { userId }
        }),
        // Accepted submissions
        prisma.submission.count({
          where: { 
            userId,
            status: 'ACCEPTED'
          }
        }),
        // Unique challenges attempted
        prisma.submission.groupBy({
          by: ['challengeId'],
          where: { userId },
          _count: true
        }).then(results => results.length),
        // Challenges completed (with accepted submissions)
        prisma.submission.groupBy({
          by: ['challengeId'],
          where: { 
            userId,
            status: 'ACCEPTED'
          },
          _count: true
        }).then(results => results.length),
        // Average score
        prisma.submission.aggregate({
          where: { 
            userId,
            score: { not: null }
          },
          _avg: {
            score: true
          }
        }),
        // User rank (users with more points)
        prisma.user.count({
          where: {
            points: {
              gt: (await prisma.user.findUnique({
                where: { id: userId },
                select: { points: true }
              }))?.points || 0
            }
          }
        }),
        // Total users
        prisma.user.count()
      ])

      const userPoints = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      })

      const successRate = submissions > 0 ? Math.round((acceptedSubmissions / submissions) * 100) : 0

      return {
        totalPoints: userPoints?.points || 0,
        totalSubmissions: submissions,
        acceptedSubmissions,
        averageScore: Math.round(avgScoreResult._avg.score || 0),
        totalChallengesAttempted: challengesAttempted,
        totalChallengesCompleted: challengesCompleted,
        successRate,
        rank: userRankResult + 1, // +1 because we count users with MORE points
        totalUsers
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return {
        totalPoints: 0,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        averageScore: 0,
        totalChallengesAttempted: 0,
        totalChallengesCompleted: 0,
        successRate: 0,
        rank: 0,
        totalUsers: 0
      }
    }
  }

  async updateUserProfile(
    userId: string, 
    data: ProfileFormData
  ): Promise<ApiResponse<User>> {
    try {
      // Update in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email
        },
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

      // Update in Supabase auth if email changed
      const { data: authUser } = await this.supabase.auth.getUser()
      if (authUser.user && authUser.user.email !== data.email) {
        await this.supabase.auth.updateUser({
          email: data.email,
          data: {
            name: data.name
          }
        })
      }

      return {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      }
    } catch (error) {
      console.error('Error updating user profile:', error)
      return {
        success: false,
        error: 'Failed to update profile'
      }
    }
  }

  async getUserRecentActivity(userId: string, limit: number = 10) {
    try {
      // Obtener actividades recientes: submissions, challenges creados, etc.
      const [recentSubmissions, createdChallenges] = await Promise.all([
        // Submissions recientes
        prisma.submission.findMany({
          where: { userId },
          include: {
            challenge: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                points: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          take: limit
        }),
        // Challenges creados recientemente 
        prisma.challenge.findMany({
          where: { creatorId: userId },
          select: {
            id: true,
            title: true,
            difficulty: true,
            points: true,
            createdAt: true,
            status: true,
            _count: {
              select: {
                submissions: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Math.floor(limit / 2) // Dividir el límite entre actividades
        })
      ])

      // Combinar y ordenar todas las actividades
      const activities: Array<{
        id: string
        type: 'submission' | 'challenge_created'
        title: string
        description: string
        date: Date
        status?: string
        challenge?: {
          id: string
          title: string
          difficulty: string
          points: number
        }
        metadata?: any
      }> = []

      // Agregar submissions
      recentSubmissions.forEach(submission => {
        activities.push({
          id: submission.id,
          type: 'submission',
          title: `Envío a "${submission.challenge.title}"`,
          description: `Estado: ${submission.status === 'ACCEPTED' ? 'Aceptado' : submission.status === 'WRONG_ANSWER' ? 'Respuesta Incorrecta' : submission.status === 'TIME_LIMIT_EXCEEDED' ? 'Tiempo Excedido' : submission.status === 'RUNTIME_ERROR' ? 'Error de Ejecución' : 'Pendiente'}`,
          date: submission.submittedAt,
          status: submission.status,
          challenge: submission.challenge,
          metadata: {
            score: submission.score,
            language: submission.language
          }
        })
      })

      // Agregar challenges creados
      createdChallenges.forEach(challenge => {
        activities.push({
          id: challenge.id,
          type: 'challenge_created',
          title: `Creó el desafío "${challenge.title}"`,
          description: `${challenge._count.submissions} envíos • Dificultad: ${challenge.difficulty === 'EASY' ? 'Fácil' : challenge.difficulty === 'MEDIUM' ? 'Medio' : 'Difícil'}`,
          date: challenge.createdAt,
          status: challenge.status,
          challenge: {
            id: challenge.id,
            title: challenge.title,
            difficulty: challenge.difficulty,
            points: challenge.points
          },
          metadata: {
            submissionsCount: challenge._count.submissions
          }
        })
      })

      // Ordenar por fecha más reciente
      activities.sort((a, b) => b.date.getTime() - a.date.getTime())

      return activities.slice(0, limit)
    } catch (error) {
      console.error('Error fetching user recent activity:', error)
      return []
    }
  }
}

export const createUserService = (supabase: SupabaseClient) => {
  return new UserService(supabase)
}
