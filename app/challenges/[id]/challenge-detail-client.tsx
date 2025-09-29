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
  challenge: ChallengeDetail
  authUser: SupabaseUser | null
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
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
    }`}>
      <div className="flex items-center gap-3">
        {getRankIcon(index + 1)}
        <Avatar className="h-8 w-8">
          <AvatarImage src={entry.user.image || ""} alt={entry.user.name || "User"} />
          <AvatarFallback>
            {entry.user.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">
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
      <div className="text-right">
        <div className="font-semibold">{entry.score}/100</div>
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

  const isAuthenticated = !!authUser
  const canSubmit = isAuthenticated && challenge.status === "ACTIVE"
  const canManage = challenge.isCreator

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
                {canManage && (
                  <>
                    <Link href={`/challenges/${challenge.id}/analytics`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {t("challenge.analytics")}
                      </Button>
                    </Link>
                    <Link href={`/challenges/${challenge.id}/settings`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        {t("challenge.settings")}
                      </Button>
                    </Link>
                  </>
                )}
                
                {canSubmit ? (
                  <Link href={`/challenges/${challenge.id}/submit`}>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      {challenge.userSubmission 
                        ? t("challenge.resubmit")
                        : t("challenge.startChallenge")
                      }
                    </Button>
                  </Link>
                ) : !isAuthenticated ? (
                  <AuthRequiredTrigger>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      {t("challenge.startChallenge")}
                    </Button>
                  </AuthRequiredTrigger>
                ) : (
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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {t("challenge.description")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{challenge.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Test Cases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    {t("challenge.testCases")}
                  </CardTitle>
                  <CardDescription>
                    {t("challenge.testCasesDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {challenge.testCases
                      .filter(tc => tc.isPublic)
                      .slice(0, 3)
                      .map((testCase, index) => (
                        <TestCaseCard 
                          key={testCase.id} 
                          testCase={testCase} 
                          index={index}
                          t={t}
                        />
                      ))
                    }
                    
                    {challenge.testCases.filter(tc => !tc.isPublic).length > 0 && (
                      <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {t("challenge.hiddenTestCases", {
                            count: challenge.testCases.filter(tc => !tc.isPublic).length.toString()
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Creator Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("challenge.createdBy")}</CardTitle>
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

              {/* User Submission Status */}
              {challenge.userSubmission && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("challenge.yourSubmission")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t("challenge.status")}</span>
                        <Badge variant={getBadgeVariant.status(challenge.userSubmission.status)}>
                          {t(`submission.status.${challenge.userSubmission.status.toLowerCase()}`)}
                        </Badge>
                      </div>
                      
                      {challenge.userSubmission.score !== null && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{t("challenge.score")}</span>
                          <span className="font-medium">{challenge.userSubmission.score}/100</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t("challenge.submitted")}</span>
                        <span className="text-sm">{formatDate.short(challenge.userSubmission.submittedAt)}</span>
                      </div>
                      
                      <Separator />
                      
                      <Link href={`/challenges/${challenge.id}/submissions`} className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          {t("challenge.viewSubmission")}
                        </Button>
                      </Link>
                    </div>
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
