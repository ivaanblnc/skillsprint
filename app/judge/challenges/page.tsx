import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Target, Clock, Code2, Users, Eye } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"

async function checkJudgeAccess() {
  const supabase = await createServerClient()
  const { data: userData, error } = await supabase.auth.getUser()
  
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  // Verificar que el usuario existe en la base de datos y es JUDGE
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { id: userData.user.id },
    select: { role: true, name: true, email: true }
  })

  if (!user) {
    redirect("/auth/login")
  }

  if (user.role !== "JUDGE") {
    redirect("/dashboard")
  }

  return { user, authUser: userData.user }
}

async function getJudgeChallenges() {
  const { prisma } = await import("@/lib/prisma")
  
  // Get all challenges with submission data
  const challenges = await prisma.challenge.findMany({
    include: {
      creator: {
        select: {
          name: true,
          email: true
        }
      },
      submissions: {
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true
        }
      },
      _count: {
        select: {
          submissions: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Process challenges data
  return challenges.map(challenge => {
    const totalSubmissions = challenge._count.submissions
    const pendingReviews = challenge.submissions.filter(s => s.status === 'PENDING').length
    const acceptedSubmissions = challenge.submissions.filter(s => s.status === 'ACCEPTED')
    const submissionsWithScores = challenge.submissions.filter(s => s.score !== null)
    
    const avgScore = submissionsWithScores.length > 0 
      ? Math.round(submissionsWithScores.reduce((sum, s) => sum + (s.score || 0), 0) / submissionsWithScores.length)
      : 0

    // Determine status based on end date
    const now = new Date()
    const endDate = new Date(challenge.endDate)
    const status = endDate > now ? 'ACTIVE' : 'COMPLETED'

    return {
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      points: challenge.points,
      creator: challenge.creator?.name || challenge.creator?.email || 'Anonymous',
      status,
      totalSubmissions,
      pendingReviews,
      avgScore,
      timeLimit: challenge.timeLimit,
      description: challenge.description,
      endDate: challenge.endDate
    }
  })
}

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

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "default"
    case "COMPLETED":
      return "secondary"
    case "CANCELLED":
      return "destructive"
    default:
      return "secondary"
  }
}

export default async function JudgeChallengesPage() {
  const { user, authUser } = await checkJudgeAccess()
  const challenges = await getJudgeChallenges()

  const activeChallenges = challenges.filter(c => c.status === "ACTIVE")
  const completedChallenges = challenges.filter(c => c.status === "COMPLETED")
  const totalPendingReviews = challenges.reduce((sum, c) => sum + c.pendingReviews, 0)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-2">Judge Challenges</h1>
            <p className="text-muted-foreground">Manage challenges assigned to you for evaluation</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Challenges</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{challenges.length}</div>
                <p className="text-xs text-muted-foreground">Total under your review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeChallenges.length}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Code2 className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPendingReviews}</div>
                <p className="text-xs text-muted-foreground">Awaiting evaluation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedChallenges.length}</div>
                <p className="text-xs text-muted-foreground">Evaluation finished</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Challenges */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Active Challenges
              </CardTitle>
              <CardDescription>
                Challenges currently accepting submissions and requiring review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeChallenges.map((challenge) => (
                  <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{challenge.title}</h3>
                            <Badge
                              variant={getDifficultyVariant(challenge.difficulty)}
                              className="text-xs"
                            >
                              {challenge.difficulty}
                            </Badge>
                            <Badge
                              variant={getStatusVariant(challenge.status)}
                              className="text-xs"
                            >
                              {challenge.status}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-3 text-sm">
                            {challenge.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Creator:</span>
                              <p className="font-medium">{challenge.creator}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Points:</span>
                              <p className="font-medium">{challenge.points}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time Limit:</span>
                              <p className="font-medium">{challenge.timeLimit} min</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avg Score:</span>
                              <p className="font-medium">{challenge.avgScore}%</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Submissions:</span>
                              <p className="font-medium">{challenge.totalSubmissions}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pending Reviews:</span>
                              <p className="font-medium text-yellow-600">{challenge.pendingReviews}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button size="sm" asChild>
                          <Link href={`/judge/submissions?challenge=${challenge.id}`}>
                            <Code2 className="h-4 w-4 mr-2" />
                            Review Submissions ({challenge.pendingReviews})
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/challenges/${challenge.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Challenge Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Completed Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Completed Challenges
              </CardTitle>
              <CardDescription>
                Challenges you have finished evaluating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedChallenges.map((challenge) => (
                  <Card key={challenge.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{challenge.title}</h3>
                            <Badge
                              variant={getDifficultyVariant(challenge.difficulty)}
                              className="text-xs"
                            >
                              {challenge.difficulty}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              COMPLETED
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <span>Submissions: {challenge.totalSubmissions}</span>
                            <span>Avg Score: {challenge.avgScore}%</span>
                            <span>Creator: {challenge.creator}</span>
                          </div>
                        </div>
                        
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/challenges/${challenge.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Results
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
