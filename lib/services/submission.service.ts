/**
 * Servicio para manejo de submissions de challenges
 * Gestiona envío, validación y procesamiento de soluciones
 */

import { prisma } from '@/lib/prisma'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SubmissionData {
  challengeId: string
  code: string
  language: string
  userId: string
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  isPublic: boolean
}

export interface SubmissionResult {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR'
  score: number
  feedback?: string
  executionTime?: number
  memoryUsage?: number
}

export class SubmissionService {
  constructor(private supabase: SupabaseClient) {}

  async submitSolution(data: SubmissionData): Promise<SubmissionResult> {
    try {
      // Create submission record
      const submission = await prisma.submission.create({
        data: {
          challengeId: data.challengeId,
          userId: data.userId,
          code: data.code,
          language: data.language,
          status: 'PENDING',
          submittedAt: new Date()
        }
      })

      // Here would be the actual code execution logic
      // For now, we'll simulate processing
      const result = await this.processSubmission(submission.id, data)

      return {
        id: submission.id,
        status: result.status,
        score: result.score,
        feedback: result.feedback,
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage
      }
    } catch (error) {
      console.error('Error submitting solution:', error)
      throw new Error('Failed to submit solution')
    }
  }

  async getSubmissionHistory(challengeId: string, userId: string) {
    try {
      const submissions = await prisma.submission.findMany({
        where: {
          challengeId,
          userId
        },
        orderBy: { submittedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
          language: true,
          feedbacks: {
            select: {
              comment: true,
              rating: true
            }
          }
        }
      })

      return submissions
    } catch (error) {
      console.error('Error fetching submission history:', error)
      return []
    }
  }

  async getTestCases(challengeId: string, isCreator: boolean = false): Promise<TestCase[]> {
    try {
      const testCases = await prisma.testCase.findMany({
        where: {
          challengeId,
          ...(isCreator ? {} : { isPublic: true })
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          input: true,
          expectedOutput: true,
          isPublic: true
        }
      })

      return testCases
    } catch (error) {
      console.error('Error fetching test cases:', error)
      return []
    }
  }

  private async processSubmission(submissionId: string, data: SubmissionData) {
    // Simulate code execution and testing
    // In a real implementation, this would:
    // 1. Run the code against test cases
    // 2. Check for compilation errors
    // 3. Measure execution time and memory
    // 4. Calculate score based on passed tests
    
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing

    // Mock result
    const mockResults = [
      { status: 'ACCEPTED' as const, score: 100, feedback: 'All test cases passed!' },
      { status: 'REJECTED' as const, score: 60, feedback: 'Some test cases failed' },
      { status: 'RUNTIME_ERROR' as const, score: 0, feedback: 'Runtime error in test case 3' }
    ]

    const result = mockResults[Math.floor(Math.random() * mockResults.length)]

    // Update submission with results
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: result.status,
        score: result.score,
        executionTime: Math.floor(Math.random() * 5000) + 100,
        memory: Math.floor(Math.random() * 50) + 10
      }
    })

    return {
      ...result,
      executionTime: Math.floor(Math.random() * 5000) + 100,
      memoryUsage: Math.floor(Math.random() * 50) + 10
    }
  }
}

export const createSubmissionService = (supabase: SupabaseClient) => {
  return new SubmissionService(supabase)
}
