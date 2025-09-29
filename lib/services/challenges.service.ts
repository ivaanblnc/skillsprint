/**
 * Servicio para manejo de desafíos
 * Implementa repository pattern para la gestión de challenges
 */

import { Challenge, ChallengesResponse, FilterState, PaginationState } from '@/lib/types'
import { prisma } from '@/lib/prisma'

const CHALLENGES_PER_PAGE = 6

export class ChallengesService {
  async getChallenges(
    page: number = 1, 
    filters: FilterState = {}
  ): Promise<ChallengesResponse> {
    try {
      const offset = (page - 1) * CHALLENGES_PER_PAGE
      
      // Build the where clause
      const where: any = { status: "ACTIVE" }
      
      if (filters.difficulty) {
        where.difficulty = filters.difficulty
      }
      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // Get challenges with pagination
      const [challenges, totalCount] = await Promise.all([
        prisma.challenge.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: CHALLENGES_PER_PAGE,
          include: {
            creator: {
              select: {
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        }),
        prisma.challenge.count({ where })
      ])

      const totalPages = Math.ceil(totalCount / CHALLENGES_PER_PAGE)

      return {
        challenges: challenges as Challenge[],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error("Error fetching challenges:", error)
      return {
        challenges: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    }
  }

  async getChallengeById(id: string): Promise<Challenge | null> {
    try {
      const challenge = await prisma.challenge.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      })

      return challenge as Challenge | null
    } catch (error) {
      console.error("Error fetching challenge:", error)
      return null
    }
  }

  async getActiveChallenges(limit: number = 6): Promise<Challenge[]> {
    try {
      const challenges = await prisma.challenge.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: limit,
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

      return challenges as Challenge[]
    } catch (error) {
      console.error("Error fetching active challenges:", error)
      return []
    }
  }
}

export const challengesService = new ChallengesService()
