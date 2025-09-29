/**
 * Challenge Detail Service - Arquitectura Limpia
 * Maneja operaciones específicas de detalles de challenges
 */

import { prisma } from "@/lib/prisma"
import type { 
  ChallengeDetail, 
  ChallengeCreateFormData,
  ManagedChallenge,
  ChallengeStats,
  TestCase,
  Submission
} from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"

export class ChallengeDetailService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Obtiene detalles completos de un challenge
   */
  async getChallengeDetail(challengeId: string, userId?: string): Promise<{
    success: boolean
    data?: ChallengeDetail
    error?: string
  }> {
    try {
      // Get user role if userId provided
      let userRole = null
      if (userId) {
        const userData = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        })
        userRole = userData?.role
      }

      // Build challenge query based on user role
      let whereCondition: any = { id: challengeId }
      
      if (userRole !== "CREATOR") {
        // Non-creators can only see ACTIVE challenges or challenges they've submitted to
        whereCondition = {
          id: challengeId,
          OR: [
            { status: "ACTIVE" },
            ...(userId ? [{ submissions: { some: { userId } } }] : [])
          ]
        }
      }

      const challenge = await prisma.challenge.findUnique({
        where: whereCondition,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true
            }
          },
          testCases: {
            orderBy: { createdAt: 'asc' }
          },
          submissions: userId ? {
            where: { userId },
            orderBy: { submittedAt: 'desc' },
            take: 1,
            include: {
              user: {
                select: { id: true, name: true, image: true }
              }
            }
          } : false,
          _count: {
            select: {
              submissions: true
            }
          }
        }
      })

      if (!challenge) {
        return { success: false, error: "Challenge not found" }
      }

      // Get leaderboard for active challenges
      const leaderboard = challenge.status === "ACTIVE" ? await prisma.submission.findMany({
        where: {
          challengeId,
          score: { not: null }
        },
        orderBy: [
          { score: 'desc' },
          { executionTime: 'asc' },
          { submittedAt: 'asc' }
        ],
        take: 10,
        include: {
          user: {
            select: { id: true, name: true, image: true }
          }
        }
      }) : []

      const result: ChallengeDetail = {
        ...challenge,
        creator: challenge.creator,
        testCases: challenge.testCases,
        userSubmission: challenge.submissions?.[0] ? {
          ...challenge.submissions[0],
          challenge: challenge
        } : null,
        isCreator: userId === challenge.creatorId,
        canEdit: userId === challenge.creatorId || userRole === "CREATOR",
        participantCount: challenge._count.submissions,
        leaderboard: leaderboard.map(sub => ({
          user: sub.user,
          score: sub.score,
          executionTime: sub.executionTime,
          submittedAt: sub.submittedAt
        }))
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Error fetching challenge detail:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch challenge" 
      }
    }
  }

  /**
   * Obtiene un challenge por ID (método de conveniencia)
   */
  async getChallengeById(challengeId: string): Promise<ChallengeDetail | null> {
    const result = await this.getChallengeDetail(challengeId)
    return result.success ? result.data || null : null
  }

  /**
   * Obtiene un challenge (alias para compatibilidad)
   */
  async getChallenge(challengeId: string): Promise<ChallengeDetail | null> {
    return this.getChallengeById(challengeId)
  }

  /**
   * Crea un nuevo challenge
   */
  async createChallenge(userId: string, data: ChallengeCreateFormData): Promise<{
    success: boolean
    data?: { id: string }
    error?: string
  }> {
    try {
      const challenge = await prisma.challenge.create({
        data: {
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          points: data.points,
          timeLimit: data.timeLimit,
          startDate: data.startDate,
          endDate: data.endDate,
          status: "DRAFT",
          creatorId: userId,
          testCases: {
            create: data.testCases.map((testCase) => ({
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              isPublic: testCase.isPublic
            }))
          }
        },
        select: { id: true }
      })

      return { success: true, data: challenge }
    } catch (error) {
      console.error("Error creating challenge:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create challenge" 
      }
    }
  }

  /**
   * Obtiene challenges del usuario para gestión
   */
  async getUserChallenges(userId: string, page = 1, limit = 10, search = ''): Promise<{
    success: boolean
    data?: {
      challenges: ManagedChallenge[]
      pagination: {
        currentPage: number
        totalPages: number
        totalCount: number
        hasNext: boolean
        hasPrev: boolean
      }
    }
    error?: string
  }> {
    try {
      const skip = (page - 1) * limit

      // Build where clause with search
      const whereClause = {
        creatorId: userId,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        })
      }

      const [challenges, totalCount] = await Promise.all([
        prisma.challenge.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: {
                submissions: true,
                testCases: true
              }
            }
          }
        }),
        prisma.challenge.count({
          where: whereClause
        })
      ])

      // Get additional stats for each challenge
      const challengesWithStats = await Promise.all(
        challenges.map(async (challenge) => {
          const stats = await this.getChallengeStats(challenge.id)
          return {
            ...challenge,
            participantCount: stats.data?.participantCount || 0,
            averageScore: stats.data?.averageScore || 0
          }
        })
      )

      const totalPages = Math.ceil(totalCount / limit)

      return {
        success: true,
        data: {
          challenges: challengesWithStats,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user challenges:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch challenges" 
      }
    }
  }

  /**
   * Obtiene estadísticas de un challenge específico
   */
  async getChallengeStats(challengeId: string): Promise<{
    success: boolean
    data?: ChallengeStats
    error?: string
  }> {
    try {
      const submissions = await prisma.submission.findMany({
        where: { challengeId },
        select: {
          score: true,
          executionTime: true,
          userId: true
        }
      })

      const totalSubmissions = submissions.length
      const acceptedSubmissions = submissions.filter(s => s.score && s.score >= 70).length
      const participantCount = new Set(submissions.map(s => s.userId)).size
      
      const scores = submissions.filter(s => s.score !== null).map(s => s.score!)
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      
      const executionTimes = submissions.filter(s => s.executionTime !== null).map(s => s.executionTime!)
      const averageExecutionTime = executionTimes.length > 0 
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
        : 0

      const completionRate = participantCount > 0 ? (acceptedSubmissions / participantCount) * 100 : 0

      return {
        success: true,
        data: {
          totalSubmissions,
          acceptedSubmissions,
          averageScore: Math.round(averageScore),
          participantCount,
          completionRate: Math.round(completionRate),
          averageExecutionTime: Math.round(averageExecutionTime)
        }
      }
    } catch (error) {
      console.error("Error fetching challenge stats:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch stats" 
      }
    }
  }

  /**
   * Actualiza el estado de un challenge
   */
  async updateChallengeStatus(challengeId: string, userId: string, status: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify ownership
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        select: { creatorId: true }
      })

      if (!challenge || challenge.creatorId !== userId) {
        return { success: false, error: "Not authorized to update this challenge" }
      }

      await prisma.challenge.update({
        where: { id: challengeId },
        data: { 
          status: status as any,
          updatedAt: new Date()
        }
      })

      return { success: true }
    } catch (error) {
      console.error("Error updating challenge status:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update challenge" 
      }
    }
  }

  /**
   * Elimina un challenge
   */
  async deleteChallenge(challengeId: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify ownership
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        select: { 
          creatorId: true,
          _count: { select: { submissions: true } }
        }
      })

      if (!challenge || challenge.creatorId !== userId) {
        return { success: false, error: "Not authorized to delete this challenge" }
      }

      if (challenge._count.submissions > 0) {
        return { success: false, error: "Cannot delete challenge with existing submissions" }
      }

      await prisma.challenge.delete({
        where: { id: challengeId }
      })

      return { success: true }
    } catch (error) {
      console.error("Error deleting challenge:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete challenge" 
      }
    }
  }
}

export const challengeDetailService = new ChallengeDetailService({} as SupabaseClient)

export function createChallengeDetailService(supabase: SupabaseClient) {
  return new ChallengeDetailService(supabase)
}
