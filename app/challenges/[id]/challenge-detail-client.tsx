/**
 * Challenge Detail Client Component - Refactorized
 * Client Component que maneja la UI del detalle del challenge
 */

"use client"

import React from 'react'
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Trophy, Clock, Users, Calendar, Code2, CheckCircle, AlertCircle, 
  ArrowLeft, Play, Eye, Settings, BarChart3, Target, Timer
} from "lucide-react"
import { AuthRequiredTrigger } from "@/components/auth-required-trigger"
import { getBadgeVariant, formatDate, formatDuration } from "@/lib/utils/index"
import type { ChallengeDetail } from "@/lib/types"
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Helper function for client-side translation
function translate(translations: Record<string, any>, key: string, params?: Record<string, any>): string {
  const keys = key.split('.')
  let value: any = translations
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  if (typeof value !== 'string') return key
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
      value
    )
  }
  
  return value
}

// Component Props Interface
interface ChallengeDetailClientProps {
  challenge: ChallengeDetail | null
  authUser: { id: string; role?: string | null } | null
  translations: Record<string, any>
}

// Test Case Component
const TestCaseCard: React.FC<{
  testCase: any
  index: number
  t: (key: string) => string
}> = ({ testCase, index, t }) => (
  <Card className="border-l-4 border-l-primary/20">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">
          {t("challenge.testCase")} #{index + 1}
        </CardTitle>
        <Badge variant={testCase.isPublic ? "default" : "secondary"}>
          {testCase.isPublic ? t("challenge.public") : t("challenge.private")}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          {t("challenge.input")}
        </Label>
        <pre className="mt-1 p-2 bg-muted rounded text-sm font-mono overflow-x-auto">
          {testCase.input}
        </pre>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          {t("challenge.expectedOutput")}
        </Label>
        <pre className="mt-1 p-2 bg-muted rounded text-sm font-mono overflow-x-auto">
          {testCase.expectedOutput}
        </pre>
      </div>
    </CardContent>
  </Card>
)

// Leaderboard Entry Component
const LeaderboardEntry: React.FC<{
  entry: any
  index: number
  currentUserId?: string
  t: (key: string) => string
}> = ({ entry, index, currentUserId, t }) => {
  const isCurrentUser = currentUserId === entry.user.id
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 rounded-lg ${
      isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        {getRankIcon(index + 1)}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={entry.user.image || ""} alt={entry.user.name || "User"} />
          <AvatarFallback>
            {entry.user.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm line-clamp-1">
            {entry.user.name || t("challenge.anonymousUser")}
            {isCurrentUser && (
              <Badge variant="outline" className="ml-2 text-xs">
                {t("challenge.you")}
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate.relative(entry.submittedAt)}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-semibold text-sm">{entry.score}/100</div>
        {entry.executionTime && (
          <div className="text-xs text-muted-foreground">
            {formatDuration(entry.executionTime)}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Main Challenge Detail Client Component
 */
export const ChallengeDetailClient: React.FC<ChallengeDetailClientProps> = ({
  challenge,
  authUser,
  translations
}) => {
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  // Guard clause: if no challenge, show not found
  if (!challenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("challenge.notFound") || "Desafío no encontrado"}</h1>
          <Link href="/challenges" className="text-primary hover:underline">
            {t("challenge.backToChallenges") || "Volver a desafíos"}
          </Link>
        </div>
      </div>
    )
  }

  const isAuthenticated = !!authUser
  const userRole = authUser?.role as 'USER' | 'CREATOR' | null
  const isCreator = userRole === 'CREATOR'
  const canSubmit = isAuthenticated && challenge.status === "ACTIVE" && !challenge.isCreator
  // Solo creadores pueden ver envíos, y solo si el desafío es suyo
  const canViewSubmissions = isCreator && challenge.isCreator

  const formatTimeRemaining = () => {
    if (challenge.status !== "ACTIVE") return null
    
    const now = new Date()
    const end = new Date(challenge.endDate || challenge.createdAt)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return t("challenge.expired")
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return t("challenge.daysRemaining", { days: days.toString() })
    if (hours > 0) return t("challenge.hoursRemaining", { hours: hours.toString() })
    return t("challenge.lessThanHour")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/challenges" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("challenge.back")}
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{challenge.title}</h1>
                  <Badge variant={getBadgeVariant.difficulty(challenge.difficulty)}>
                    {t(`difficulty.${challenge.difficulty.toLowerCase()}`)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {challenge.points} {t("challenge.points")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    {challenge.timeLimit} {t("challenge.minutes")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {challenge.participantCount || 0} {t("challenge.participants")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate.short(challenge.startDate || challenge.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Si es creador del desafío: mostrar botón de ver envíos */}
                {canViewSubmissions ? (
                  <Link href={`/challenges/${challenge.id}/submissions`}>
                    <Button>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t("challenge.viewSubmissions")}
                    </Button>
                  </Link>
                ) : !isCreator && canSubmit && !challenge.userSubmission ? (
                  // Si es PARTICIPANTE sin envío previo: mostrar "Comenzar Desafío"
                  <Link href={`/challenges/${challenge.id}/submit`}>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      {t("challenge.startChallenge")}
                    </Button>
                  </Link>
                ) : !isCreator && challenge.userSubmission ? (
                  // Si es PARTICIPANTE con envío previo: no mostrar botón, solo ver card "Tu Envío"
                  <Button disabled className="opacity-50">
                    <Eye className="h-4 w-4 mr-2" />
                    {t("challenge.viewOnly")}
                  </Button>
                ) : !isAuthenticated ? (
                  // Si no está autenticado
                  <AuthRequiredTrigger>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      {t("challenge.startChallenge")}
                    </Button>
                  </AuthRequiredTrigger>
                ) : (
                  // Desafío no activo, creador de desafío sin permisos, o sin envío
                  <Button disabled>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("challenge.viewOnly")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Status and Time Remaining */}
          {challenge.status === "ACTIVE" && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">{t("challenge.activeChallenge")}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatTimeRemaining()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-8 flex flex-col" style={{minHeight: 'auto'}}>
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                    <Target className="h-5 w-5 text-primary" />
                    {t("challenge.description")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none max-h-48 lg:max-h-64 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm lg:text-base">{challenge.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Test Cases */}
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                    <Code2 className="h-5 w-5 text-primary" />
                    {t("challenge.testCases")}
                  </CardTitle>
                  <CardDescription className="text-sm lg:text-base">
                    {t("challenge.testCasesDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4 max-h-96 lg:max-h-full overflow-y-auto">
                    {challenge.testCases.filter(tc => tc.isPublic).slice(0, 3).map((testCase, index) => (
                      <TestCaseCard key={testCase.id} testCase={testCase} index={index} t={t} />
                    ))}
                    {challenge.testCases.filter(tc => !tc.isPublic).length > 0 && (
                      <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {t("challenge.hiddenTestCases", { count: challenge.testCases.filter(tc => !tc.isPublic).length.toString() })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 lg:space-y-6 flex flex-col" style={{minHeight: 'auto'}}>
              {/* Creator Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base lg:text-lg">{t("challenge.createdBy")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage 
                        src={challenge.creator.image || ""} 
                        alt={challenge.creator.name || "Creator"} 
                      />
                      <AvatarFallback>
                        {challenge.creator.name?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {challenge.creator.name || t("challenge.anonymousCreator")}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {t(`profile.roles.${challenge.creator.role.toLowerCase()}`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Submission Status - Solo para PARTICIPANTES (no creadores) */}
              {!isCreator && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("challenge.yourSubmission")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {challenge.userSubmission ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{t("challenge.status")}</span>
                          <Badge variant={getBadgeVariant.status(challenge.userSubmission.status)}>
                            {t(`submission.status.${challenge.userSubmission.status.toLowerCase()}`)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{t("challenge.score")}</span>
                          {challenge.userSubmission.score !== null && challenge.userSubmission.score !== undefined ? (
                            <span className="font-medium text-lg">{challenge.userSubmission.score}/100</span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">{t("challenge.pendingGrading") || "Pendiente de calificación"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{t("challenge.submitted")}</span>
                          <span className="text-sm">{formatDate.short(challenge.userSubmission.submittedAt)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[120px] text-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{t("challenge.noSubmission")}</p>
                        {canSubmit && (
                          <Link href={`/challenges/${challenge.id}/submit`}>
                            <Button size="sm" className="mt-2">
                              <Play className="h-4 w-4 mr-2" />
                              {t("challenge.startChallenge")}
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Leaderboard */}
              {challenge.leaderboard && challenge.leaderboard.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      {t("challenge.leaderboard")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {challenge.leaderboard.slice(0, 5).map((entry, index) => (
                        <LeaderboardEntry
                          key={entry.user.id}
                          entry={entry}
                          index={index}
                          currentUserId={authUser?.id}
                          t={t}
                        />
                      ))}
                      
                      {challenge.leaderboard.length > 5 && (
                        <div className="text-center pt-2">
                          <Link href={`/challenges/${challenge.id}/submissions`}>
                            <Button variant="ghost" size="sm">
                              {t("challenge.viewAllSubmissions")}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Missing Label component import
const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className}>{children}</div>
)
