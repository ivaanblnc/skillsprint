/**
 * Tipos centralizados para todo el proyecto
 * Siguiendo principios de TypeScript estricto y clean architecture
 */

// Core domain types
export interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  points: number
  image?: string | null
  createdAt: string | Date
  user_metadata?: {
    avatar_url?: string
  }
}

export type UserRole = 'PARTICIPANT' | 'CREATOR' | 'ADMIN'

export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: ChallengeDifficulty
  points: number
  timeLimit: number
  status: ChallengeStatus
  startDate?: string | Date
  endDate?: string | Date
  createdAt: string | Date
  updatedAt?: string | Date
  creatorId: string
  creator?: {
    name: string | null
    image: string | null
  }
  _count?: {
    submissions: number
  }
}

export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type ChallengeStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

// Analytics types
export interface Analytics {
  totalSubmissions: number
  uniqueParticipants: number
  acceptedSubmissions: number
  averageScore: number
  submissionsByDay: { date: string; count: number }[]
  statusDistribution: { status: string; count: number }[]
  difficultyMetrics: {
    averageAttempts: number
    successRate: number
  }
}

export interface Submission {
  id: string
  challengeId: string
  userId: string
  code: string | null
  language: string | null
  status: SubmissionStatus
  score?: number | null
  submittedAt: string | Date
  challenge: {
    title: string
    difficulty: ChallengeDifficulty
  }
}

export type SubmissionStatus = 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' | 'REJECTED'

// User activity types
export interface UserActivity {
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
}

// UI State types
export interface PaginationState {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

export interface FilterState {
  difficulty?: ChallengeDifficulty
  search?: string
  status?: ChallengeStatus
}

// Dashboard specific types
export interface DashboardStats {
  totalPoints: number
  totalSubmissions: number
  acceptedSubmissions: number
  averageScore: number
}

export interface UserStats extends DashboardStats {
  totalChallengesAttempted: number
  totalChallengesCompleted: number
  successRate: number
  rank: number
  totalUsers: number
  recentActivity?: ActivityItem[]
}

export interface ActivityItem {
  id: string
  title: string
  description: string
  timeAgo: string
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'gray'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ChallengesResponse {
  challenges: Challenge[]
  pagination: PaginationState
}

// Form types
export interface ProfileFormData {
  name: string
  email: string
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

// Challenge Detail Types  
export interface ChallengeDetail extends Challenge {
  creator: {
    id: string
    name: string | null
    image: string | null
    role: UserRole
  }
  testCases: TestCase[]
  submissions?: Submission[]
  userSubmission?: Submission | null
  isCreator?: boolean
  canEdit?: boolean
  participantCount?: number
  leaderboard?: {
    user: {
      id: string
      name: string | null
      image: string | null
    }
    score: number | null
    executionTime: number | null
    submittedAt: Date
  }[]
}

export interface TestCase {
  id: string
  challengeId: string
  input: string
  expectedOutput: string
  isPublic: boolean
  createdAt: Date
}

// Challenge Creation Types
export interface ChallengeCreateFormData {
  title: string
  description: string
  difficulty: ChallengeDifficulty
  points: number
  timeLimit: number
  startDate: Date
  endDate: Date
  testCases: CreateTestCase[]
}

export interface CreateTestCase {
  input: string
  expectedOutput: string
  isPublic: boolean
}

// Challenge Management Types
export interface ManagedChallenge extends Challenge {
  _count: {
    submissions: number
    testCases: number
  }
  participantCount?: number
  averageScore?: number
}

export interface ChallengeStats {
  totalSubmissions: number
  acceptedSubmissions: number
  averageScore: number
  participantCount: number
  completionRate: number
  averageExecutionTime: number
}
