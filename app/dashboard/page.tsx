// app/dashboard/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { getMessages, translate } from "@/lib/server-i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Target, Code2, Star, Zap, ArrowRight, Clock, Users, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Suspense } from "react"
import Link from "next/link"
import type { SupabaseClient } from '@supabase/supabase-js'

// Skeleton component para carga
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-300 dark:bg-gray-700 rounded ${className}`} />
}

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

interface SubmissionWithChallenge {
  status: 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR'
  score: number | null
  challenge: {
    points: number
  } | null
}

interface Stats {
  totalSubmissions: number
  acceptedSubmissions: number
  totalPoints: number
  averageScore: number
}

// Función para obtener datos del dashboard
async function getDashboardData(userId: string, supabase: SupabaseClient) {
  try {
    console.log("Fetching dashboard data for user:", userId)
    
    // Usar Prisma para obtener el usuario de la base de datos local
    const { prisma } = await import("@/lib/prisma")
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
      }
    })
    
    if (!user) {
      console.error("User not found in database:", userId)
      console.error("This means the callback didn't create the user properly")
      return null
    }
    
    console.log("User found in database:", user)

    // Usar Prisma para obtener datos de submissions y challenges
    const [userSubmissions, activeChallenges, recentSubmissions] = await Promise.all([
      // Get user's submissions
      prisma.submission.findMany({
        where: { userId },
        include: {
          challenge: {
            select: {
              title: true,
              difficulty: true,
              points: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      }),
      
      // Get active challenges
      prisma.challenge.findMany({
        where: {
          status: "ACTIVE",
          endDate: { gt: new Date() }
        },
        include: {
          _count: {
            select: { submissions: true }
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get recent submissions (last 5)
      prisma.submission.findMany({
        where: { userId },
        include: {
          challenge: {
            select: {
              title: true,
              difficulty: true,
              points: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 5
      })
    ])

    // Procesar los datos para el formato esperado
    const submissions = userSubmissions.map(s => ({
      status: s.status,
      score: s.score,
      challenge: s.challenge ? {
        points: s.challenge.points
      } : null,
    })) as SubmissionWithChallenge[]

    const acceptedSubmissions = submissions.filter((s) => s.status === "ACCEPTED")
    
    const stats: Stats = {
      totalSubmissions: submissions.length,
      acceptedSubmissions: acceptedSubmissions.length,
      totalPoints: acceptedSubmissions.reduce((sum, s) => sum + (s.challenge?.points || 0), 0),
      averageScore:
        submissions.length > 0
          ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
          : 0,
    }

    // Convertir el usuario de Prisma al formato esperado
    const userFormatted: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      created_at: user.createdAt.toISOString(),
    }

    return { user: userFormatted, stats, activeChallenges, recentSubmissions }
  } catch (error) {
    console.error("Error in getDashboardData:", error)
    return null
  }
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

// Función auxiliar para obtener el texto traducido del status
function getStatusText(status: string, t: (key: string) => string): string {
  const statusMap: Record<string, string> = {
    "ACCEPTED": "submissions.status.accepted",
    "PENDING": "submissions.status.pending",
    "WRONG_ANSWER": "submissions.status.wrongAnswer",
    "TIME_LIMIT_EXCEEDED": "submissions.status.timeLimitExceeded",
    "RUNTIME_ERROR": "submissions.status.runtimeError",
    "COMPILATION_ERROR": "submissions.status.compilationError",
    "REJECTED": "submissions.status.rejected"
  }
  
  return t(statusMap[status] || "submissions.status.pending")
}

// Componente StatsCard reutilizable
function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  showProgress = false 
}: { 
  title: string
  value?: number
  description?: string
  icon: React.ReactNode
  showProgress?: boolean
}) {
  return (
    <Card className="glass-elevated">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <div className="p-2 bg-primary/5 liquid-border">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2 text-primary">
          {value !== undefined ? (showProgress ? `${value}%` : value) : <Skeleton className="h-8 w-16" />}
        </div>
        {description && <p className="text-sm text-muted-foreground font-medium">{description}</p>}
        {showProgress && value !== undefined && (
          <Progress value={value} className="mt-3 h-2" />
        )}
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  // Get translations for the server
  const messages = await getMessages()
  const t = (key: string, params?: Record<string, string>) => translate(messages, key, params)
  try {
    console.log("=== DASHBOARD DEBUG ===")
    
    // Crear el cliente de Supabase
    const cookieStore = cookies()
    const supabase = await createServerClient()
    
    console.log("Supabase client created successfully")
    
    // Verificar que el cliente se haya creado correctamente
    if (!supabase || !supabase.auth) {
      console.error("Failed to initialize Supabase client")
      redirect("/auth/login")
    }

    // Obtener usuario autenticado con manejo de errores
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    console.log("Auth check result:")
    console.log("- Error:", userError)
    console.log("- User ID:", userData?.user?.id)
    console.log("- User Email:", userData?.user?.email)
    
    // Si hay error al obtener el usuario o no hay usuario válido, redirigir
    if (userError) {
      console.error("User authentication error:", userError)
      redirect("/auth/login")
    }

    // Verificar si hay usuario autenticado
    if (!userData?.user) {
      console.log("No authenticated user found")
      redirect("/auth/login")
    }

    const authUser = userData.user
    console.log("Authenticated user:", authUser.id, authUser.email)

    // Obtener datos del dashboard
    const dashboardData = await getDashboardData(authUser.id, supabase)
    
    // Si no se pudieron obtener los datos o no existe el usuario, redirigir
    if (!dashboardData || !dashboardData.user) {
      console.error("Failed to fetch dashboard data or user not found")
      redirect("/auth/login")
    }

    const { user, stats, activeChallenges, recentSubmissions } = dashboardData

    const successRate = stats.totalSubmissions > 0 
      ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) 
      : 0

    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />

        <main className="container mx-auto px-4 py-12">
          {/* Welcome Section */}
          <div className="mb-12 glass-card p-8 liquid-border-lg glass-elevated">
            <div className="flex items-center gap-6 mb-6">
              <Avatar className="h-20 w-20 liquid-border glass-elevated">
                <AvatarImage 
                  src={authUser.user_metadata?.avatar_url || ""} 
                  alt={user.name || user.email || "User"} 
                />
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-balance mb-3">
                  {t("dashboard.welcome")}, {user.name || t("dashboard.developer")}!
                </h1>
                <p className="text-muted-foreground text-lg">{t("dashboard.readyForChallenge")}</p>
              </div>
            </div>
            <Badge variant="secondary" className="capitalize liquid-border px-4 py-2">
              {user.role ? t(`auth.${user.role.toLowerCase()}`) : t("dashboard.developer")}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <StatsCard 
              title={t("dashboard.totalPoints")} 
              value={stats.totalPoints} 
              description={`+${user.points || 0} ${t("dashboard.fromProfile")}`} 
              icon={<Trophy className="h-4 w-4 text-primary" />} 
            />
            <StatsCard 
              title={t("dashboard.submissions")} 
              value={stats.totalSubmissions} 
              description={`${stats.acceptedSubmissions} ${t("dashboard.accepted")}`} 
              icon={<Code2 className="h-4 w-4 text-primary" />} 
            />
            <StatsCard 
              title={t("dashboard.successRate")} 
              value={successRate} 
              icon={<Target className="h-4 w-4 text-primary" />}
              showProgress={true}
            />
            <StatsCard 
              title={t("dashboard.avgScore")} 
              value={stats.averageScore} 
              description={t("dashboard.outOf100")} 
              icon={<Star className="h-4 w-4 text-primary" />} 
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Active Challenges */}
            <div className="lg:col-span-2">
              <Card className="glass-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-primary/5 liquid-border">
                          <Zap className="h-6 w-6 text-primary" />
                        </div>
                        {t("challenges.title")}
                      </CardTitle>
                      <CardDescription className="text-base mt-2">{t("dashboard.jumpIntoLive")}</CardDescription>
                    </div>
                    <Link href="/challenges">
                      <Button variant="outline" size="lg" className="liquid-border">
                        {t("dashboard.viewAll")} <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activeChallenges.length > 0 ? (
                      activeChallenges.map((challenge) => (
                        <div key={challenge.id} className="flex items-center justify-between p-6 glass-card liquid-border-lg glass-elevated">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-semibold text-lg">{challenge.title}</h3>
                              <Badge
                                variant={getDifficultyVariant(challenge.difficulty)}
                                className="liquid-border"
                              >
                                {t(`challenges.difficulty.${challenge.difficulty?.toLowerCase()}`)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-6 text-muted-foreground">
                              <span className="flex items-center gap-2 p-2 glass-card liquid-border">
                                <Trophy className="h-4 w-4 text-primary" />{challenge.points} {t("dashboard.pts")}
                              </span>
                              <span className="flex items-center gap-2 p-2 glass-card liquid-border">
                                <Clock className="h-4 w-4 text-primary" />{challenge.timeLimit}{t("dashboard.min")}
                              </span>
                              <span className="flex items-center gap-2 p-2 glass-card liquid-border">
                                <Users className="h-4 w-4 text-primary" />{challenge._count?.submissions || 0}
                              </span>
                            </div>
                          </div>
                          <Link href={`/challenges/${challenge.id}`}>
                            <Button size="lg" className="liquid-border">{t("dashboard.startChallenge")}</Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 glass-card liquid-border-lg glass-elevated">
                        <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">{t("dashboard.noChallenges")}</p>
                        <p className="text-muted-foreground">{t("dashboard.checkBackLater")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <Card className="glass-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-primary/5 liquid-border">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    {t("dashboard.recentActivity")}
                  </CardTitle>
                  <CardDescription className="text-base">{t("dashboard.yourLatest")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {recentSubmissions.length > 0 ? (
                      recentSubmissions.map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between p-4 glass-card liquid-border glass-elevated">
                          <div className="flex-1">
                            <p className="font-semibold text-base">{submission.challenge.title}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge
                                variant={getStatusVariant(submission.status)}
                                className="liquid-border"
                              >
                                {getStatusText(submission.status, t)}
                              </Badge>
                              {submission.score && (
                                <span className="text-sm text-muted-foreground font-medium">
                                  {submission.score}/100
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">
                            {submission.submittedAt instanceof Date 
                              ? submission.submittedAt.toLocaleDateString() 
                              : new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 glass-card liquid-border-lg glass-elevated">
                        <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">{t("dashboard.noSubmissionsYet")}</p>
                        <p className="text-muted-foreground">{t("dashboard.startFirst")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-8 glass-elevated">
                <CardHeader>
                  <CardTitle className="text-xl">{t("dashboard.quickActions")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/challenges" className="block">
                    <Button variant="outline" className="w-full justify-start h-12 liquid-border">
                      <Target className="mr-3 h-5 w-5" /> {t("dashboard.browseChallenges")}
                    </Button>
                  </Link>
                  <Link href="/leaderboard" className="block">
                    <Button variant="outline" className="w-full justify-start h-12 liquid-border">
                      <Trophy className="mr-3 h-5 w-5" /> {t("dashboard.viewLeaderboard")}
                    </Button>
                  </Link>
                  {user.role === "CREATOR" && (
                    <>
                      <Link href="/challenges/create" className="block">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Code2 className="mr-2 h-4 w-4" /> {t("dashboard.createChallenge")}
                        </Button>
                      </Link>
                      <Link href="/challenges/manage" className="block">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Trophy className="mr-2 h-4 w-4" /> {t("dashboard.manageMyChallenges")}
                        </Button>
                      </Link>
                    </>
                  )}
                  {user.role === "JUDGE" && (
                    <>
                      <Link href="/judge/submissions" className="block">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Target className="mr-2 h-4 w-4" /> {t("dashboard.reviewSubmissions")}
                        </Button>
                      </Link>
                      <Link href="/judge/challenges" className="block">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Users className="mr-2 h-4 w-4" /> {t("dashboard.judgeChallenges")}
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    redirect("/auth/login")
  }
}