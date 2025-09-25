"use client"

import { useTranslations } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Target, Clock, Code2, TrendingUp, Star, Users, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

// Tipos para mejor type safety
interface User {
  id?: string
  name: string | null
  email: string | null
  role: string | null
  points: number | null
  created_at: string
}

interface Challenge {
  id: string
  title: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  points: number
  timeLimit: number
  _count: { submissions: number }
}

interface Submission {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR'
  score: number | null
  submittedAt: Date
  challenge: {
    title: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    points: number
  }
}

interface Stats {
  totalSubmissions: number
  acceptedSubmissions: number
  totalPoints: number
  averageScore: number
}

interface DashboardClientProps {
  user: User
  stats: Stats
  activeChallenges: Challenge[]
  recentSubmissions: Submission[]
}

// Función auxiliar para obtener el color del badge de dificultad
function getDifficultyVariant(difficulty: string): "default" | "secondary" | "destructive" {
  switch (difficulty?.toUpperCase()) {
    case "EASY":
      return "secondary"
    case "MEDIUM":
      return "default"
    case "HARD":
      return "destructive"
    default:
      return "default"
  }
}

// Función auxiliar para obtener el color del badge de status
function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACCEPTED":
      return "default"
    case "PENDING":
      return "secondary"
    case "WRONG_ANSWER":
    case "TIME_LIMIT_EXCEEDED":
    case "RUNTIME_ERROR":
    case "COMPILATION_ERROR":
      return "destructive"
    default:
      return "secondary"
  }
}

export function DashboardClient({ user, stats, activeChallenges, recentSubmissions }: DashboardClientProps) {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-background">
      {/* Header con información del usuario */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">
                  {t("dashboard.welcome")}, {user.name || user.email?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-muted-foreground">
                  {user.role === 'CREATOR' ? t("profile.roles.creator") : t("profile.roles.participant")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{user.points || 0}</div>
              <div className="text-sm text-muted-foreground">{t("dashboard.totalPoints")}</div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalChallenges")}</CardTitle>
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalSubmissions}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {stats.acceptedSubmissions} {t("dashboard.completedChallenges")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.completedChallenges")}</CardTitle>
              <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.acceptedSubmissions}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.totalSubmissions > 0 ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) : 0}% success rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.pendingSubmissions")}</CardTitle>
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stats.totalSubmissions - stats.acceptedSubmissions}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Avg. Score: {stats.averageScore}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalPoints")}</CardTitle>
              <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalPoints}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {stats.acceptedSubmissions > 0 ? Math.round(stats.totalPoints / stats.acceptedSubmissions) : 0} avg/challenge
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    {t("challenges.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("challenges.allChallenges")}
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/challenges">
                    {t("dashboard.viewAll")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium">{challenge.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getDifficultyVariant(challenge.difficulty)}>
                          {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {challenge.points} {t("challenges.details.points")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {challenge._count.submissions} {t("challenges.details.submissions")}
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/challenges/${challenge.id}`}>
                        Start
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("dashboard.noChallenges")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t("dashboard.recentActivity")}
                  </CardTitle>
                  <CardDescription>
                    {t("submissions.mySubmissions")}
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/challenges">
                    {t("dashboard.viewAll")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <h3 className="font-medium">{submission.challenge.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusVariant(submission.status)}>
                          {t(`submissions.status.${submission.status.toLowerCase()}`)}
                        </Badge>
                        <Badge variant={getDifficultyVariant(submission.challenge.difficulty)}>
                          {t(`challenges.difficulty.${submission.challenge.difficulty.toLowerCase()}`)}
                        </Badge>
                        {submission.score && (
                          <span className="text-sm text-muted-foreground">
                            {submission.score}% score
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("dashboard.noActivity")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
