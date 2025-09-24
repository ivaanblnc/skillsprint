import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Target, Users, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"

async function checkJudgeAccess() {
  const supabase = await createServerClient()
  const { data: userData, error } = await supabase.auth.getUser()
  
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

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

async function getChallengeResults(challengeId: string) {
  const { prisma } = await import("@/lib/prisma")
  
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      creator: {
        select: {
          name: true,
          email: true
        }
      },
      submissions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          reviewedBy: {
            select: {
              name: true,
              email: true
            }
          },
          feedbacks: {
            select: {
              comment: true,
              rating: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      }
    }
  })

  if (!challenge) {
    redirect("/judge/challenges")
  }

  return challenge
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACCEPTED":
      return "default"
    case "PENDING":
      return "secondary"
    case "REJECTED":
    case "WRONG_ANSWER":
    case "TIME_LIMIT_EXCEEDED":
    case "RUNTIME_ERROR":
    case "COMPILATION_ERROR":
      return "destructive"
    default:
      return "secondary"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "ACCEPTED":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "PENDING":
      return <Clock className="h-4 w-4 text-yellow-500" />
    default:
      return <XCircle className="h-4 w-4 text-red-500" />
  }
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

export default async function ChallengeResultsPage({
  params
}: {
  params: { id: string }
}) {
  const { user, authUser } = await checkJudgeAccess()
  const challenge = await getChallengeResults(params.id)

  // Calculate statistics
  const totalSubmissions = challenge.submissions.length
  const acceptedSubmissions = challenge.submissions.filter(s => s.status === 'ACCEPTED').length
  const rejectedSubmissions = challenge.submissions.filter(s => s.status === 'REJECTED').length
  const pendingSubmissions = challenge.submissions.filter(s => s.status === 'PENDING').length
  
  const averageScore = totalSubmissions > 0 
    ? Math.round(challenge.submissions
        .filter(s => s.score !== null)
        .reduce((sum, s) => sum + (s.score || 0), 0) / totalSubmissions)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/judge/challenges" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Judge Challenges
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{challenge.title}</h1>
                <p className="text-muted-foreground mb-4">Challenge Results & Submissions</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant={getDifficultyVariant(challenge.difficulty)} className="text-xs">
                      {challenge.difficulty}
                    </Badge>
                    <span>Max Points: {challenge.points}</span>
                    <span>Time Limit: {challenge.timeLimit}min</span>
                    <span>Creator: {challenge.creator.name || challenge.creator.email?.split('@')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Participants</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{acceptedSubmissions}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{rejectedSubmissions}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingSubmissions > 0 ? `${pendingSubmissions} pending` : 'All reviewed'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageScore}</div>
                <p className="text-xs text-muted-foreground">Out of {challenge.points}</p>
              </CardContent>
            </Card>
          </div>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                All Submissions
              </CardTitle>
              <CardDescription>
                Complete list of submissions for this challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challenge.submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p>No submissions yet for this challenge</p>
                  </div>
                ) : (
                  challenge.submissions.map((submission) => (
                    <Card key={submission.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={submission.user.image || ""} />
                                <AvatarFallback className="text-sm">
                                  {submission.user.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold">{submission.user.name || submission.user.email?.split('@')[0]}</h3>
                                <p className="text-sm text-muted-foreground">{submission.user.email}</p>
                              </div>
                              <Badge
                                variant={getStatusVariant(submission.status)}
                                className="text-xs flex items-center gap-1"
                              >
                                {getStatusIcon(submission.status)}
                                {submission.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                              <div>
                                <span className="font-medium">Score:</span>{' '}
                                <span className={submission.score !== null ? 
                                  (submission.score >= challenge.points * 0.7 ? 'text-green-600' : 
                                   submission.score >= challenge.points * 0.4 ? 'text-yellow-600' : 'text-red-600') 
                                  : ''}>
                                  {submission.score !== null ? `${submission.score}/${challenge.points}` : 'Not scored'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Language:</span> {submission.language || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Submitted:</span>{' '}
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Reviewed:</span>{' '}
                                {submission.reviewedAt 
                                  ? new Date(submission.reviewedAt).toLocaleDateString()
                                  : 'Not yet'}
                              </div>
                            </div>

                            {submission.reviewedBy && (
                              <div className="text-sm text-muted-foreground mb-3">
                                <span className="font-medium">Reviewed by:</span> {submission.reviewedBy.name || submission.reviewedBy.email?.split('@')[0]}
                              </div>
                            )}

                            {submission.feedbacks.map((feedback) => (
                              <div key={feedback.createdAt.toString()} className="bg-muted/50 rounded-lg p-3 text-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">Judge Feedback:</span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-muted-foreground">{feedback.comment}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
