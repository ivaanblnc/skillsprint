import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

// Revalidate this page every 30 seconds to show updated submission statuses
export const revalidate = 30
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Clock, Users, Calendar, Code2, CheckCircle, AlertCircle, Clock as ClockIcon } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { AuthRequiredTrigger } from "@/components/auth-required-trigger"

async function getUserIfAuthenticated() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

async function getChallengeWithSubmission(challengeId: string, userId?: string) {
  try {
    // First, get user information if userId is provided
    let userRole = null
    if (userId) {
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      userRole = userData?.role
    }

    let challenge
    
    if (userRole === "CREATOR") {
      // For creators, allow access to their own challenges (any status)
      challenge = await prisma.challenge.findUnique({
        where: { 
          id: challengeId,
          creatorId: userId // Creators can only see their own challenges
        },
        include: {
          creator: {
            select: {
              name: true,
              image: true
            }
          },
          testCases: {
            where: { isPublic: true },
            select: {
              input: true,
              expectedOutput: true
            }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        }
      })
    } else {
      // For participants and anonymous users, only allow access to ACTIVE or COMPLETED challenges
      challenge = await prisma.challenge.findFirst({
        where: {
          id: challengeId,
          status: { in: ["ACTIVE", "COMPLETED"] }
        },
        include: {
          creator: {
            select: {
              name: true,
              image: true
            }
          },
          testCases: {
            where: { isPublic: true },
            select: {
              input: true,
              expectedOutput: true
            }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        }
      })
    }

    if (!challenge) {
      return null
    }

    // Get user's submission if authenticated
    let userSubmission = null
    if (userId) {
      userSubmission = await prisma.submission.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId
          }
        },
        include: {
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
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      })
    }

    return { challenge, userSubmission }
  } catch (error) {
    console.error("Error fetching challenge:", error)
    return null
  }
}

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const user = await getUserIfAuthenticated()
  
  // Get challenge from database
  const result = await getChallengeWithSubmission(params.id, user?.id)
  
  if (!result || !result.challenge) {
    notFound()
  }

  const { challenge, userSubmission } = result

  const timeRemaining = Math.max(
    0,
    Math.floor((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  const hasEnded = new Date() > challenge.endDate
  
  // Check if user can participate (challenge not ended and no finalized submission)
  const canParticipate = !hasEnded && (!userSubmission || (userSubmission as any).isDraft)

  const getSubmissionStatus = () => {
    if (!userSubmission) return null
    
    const statusConfig = {
      ACCEPTED: { icon: CheckCircle, variant: "secondary" as const, text: "Solution Accepted", color: "text-green-600" },
      REJECTED: { icon: AlertCircle, variant: "destructive" as const, text: "Solution Rejected", color: "text-red-600" },
      PENDING: { icon: ClockIcon, variant: "default" as const, text: "Pending Review", color: "text-yellow-600" },
      WRONG_ANSWER: { icon: AlertCircle, variant: "destructive" as const, text: "Wrong Answer", color: "text-red-600" },
      RUNTIME_ERROR: { icon: AlertCircle, variant: "destructive" as const, text: "Runtime Error", color: "text-red-600" },
      COMPILATION_ERROR: { icon: AlertCircle, variant: "destructive" as const, text: "Compilation Error", color: "text-red-600" },
      TIME_LIMIT_EXCEEDED: { icon: AlertCircle, variant: "destructive" as const, text: "Time Limit Exceeded", color: "text-red-600" },
    }

    return statusConfig[userSubmission.status as keyof typeof statusConfig] || null
  }

  const submissionStatus = getSubmissionStatus()

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 text-balance">{challenge.title}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <Badge
                    variant={
                      challenge.difficulty === "EASY"
                        ? "secondary"
                        : challenge.difficulty === "MEDIUM"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {challenge.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    <Trophy className="h-3 w-3 mr-1" />
                    {challenge.points} points
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Show submission status if user has submitted */}
                {userSubmission && submissionStatus && (
                  <div className="flex items-center gap-2">
                    <submissionStatus.icon className={`h-4 w-4 ${submissionStatus.color}`} />
                    <Badge variant={submissionStatus.variant}>
                      {submissionStatus.text}
                    </Badge>
                    {userSubmission.score && (
                      <span className="text-sm text-muted-foreground">
                        {userSubmission.score}/100
                      </span>
                    )}
                  </div>
                )}
                
                {/* Action buttons */}
                {canParticipate && user && (
                  <Link href={`/challenges/${challenge.id}/submit`}>
                    <Button>
                      <Code2 className="h-4 w-4 mr-2" />
                      {userSubmission && (userSubmission as any).isDraft 
                        ? "Continue Draft" 
                        : userSubmission 
                          ? "Improve Solution" 
                          : "Start Challenge"}
                    </Button>
                  </Link>
                )}
                {!hasEnded && !user && (
                  <AuthRequiredTrigger>
                    <Button>
                      <Code2 className="h-4 w-4 mr-2" />
                      Start Challenge
                    </Button>
                  </AuthRequiredTrigger>
                )}
                {userSubmission && userSubmission.status === "ACCEPTED" && (
                  <Button disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {challenge.timeLimit} minutes
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {challenge._count.submissions} submissions
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {hasEnded ? "Ended" : `${timeRemaining} days left`}
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-pretty whitespace-pre-wrap">{challenge.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Test Cases */}
              {challenge.testCases && challenge.testCases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Example Test Cases</CardTitle>
                    <CardDescription>These are sample inputs and expected outputs for your solution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {challenge.testCases.map((testCase, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Input:</h4>
                              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                                <code>{testCase.input}</code>
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Expected Output:</h4>
                              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                                <code>{testCase.expectedOutput}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Challenge Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={hasEnded ? "destructive" : "default"}>{hasEnded ? "Ended" : "Active"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Limit</span>
                    <span className="text-sm font-medium">{challenge.timeLimit} minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Points</span>
                    <span className="text-sm font-medium">{challenge.points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Submissions</span>
                    <span className="text-sm font-medium">{challenge._count.submissions}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={challenge.creator?.image || ""} />
                      <AvatarFallback>{challenge.creator?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Created by</p>
                      <p className="text-xs text-muted-foreground">{challenge.creator?.name || "Unknown"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Show submission status card if user has submitted */}
                  {userSubmission && submissionStatus && (
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <submissionStatus.icon className={`h-4 w-4 ${submissionStatus.color}`} />
                        <span className="font-medium text-sm">{submissionStatus.text}</span>
                      </div>
                      
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span className={`font-medium ${
                            userSubmission.score !== null ? 
                              (userSubmission.score >= challenge.points * 0.7 ? 'text-green-600' : 
                               userSubmission.score >= challenge.points * 0.4 ? 'text-yellow-600' : 'text-red-600') 
                              : ''
                          }`}>
                            {userSubmission.score !== null ? `${userSubmission.score}/${challenge.points}` : 'Not scored yet'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Submitted:</span>
                          <span>{new Date(userSubmission.submittedAt).toLocaleDateString()}</span>
                        </div>
                        
                        {userSubmission.reviewedAt && (
                          <div className="flex justify-between">
                            <span>Reviewed:</span>
                            <span>{new Date(userSubmission.reviewedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {userSubmission.reviewedBy && (
                          <div className="flex justify-between">
                            <span>Reviewed by:</span>
                            <span>{userSubmission.reviewedBy.name || userSubmission.reviewedBy.email?.split('@')[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Judge Feedback */}
                      {userSubmission.feedbacks && userSubmission.feedbacks.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/50">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">Judge Feedback:</span>
                              {userSubmission.feedbacks[0].rating && (
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-xs ${i < userSubmission.feedbacks[0].rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground bg-background/50 rounded p-2 border">
                              {userSubmission.feedbacks[0].comment}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {canParticipate && user && (
                    <Link href={`/challenges/${challenge.id}/submit`} className="block">
                      <Button className="w-full">
                        <Code2 className="h-4 w-4 mr-2" />
                        {userSubmission ? "Continue Draft" : "Start Coding"}
                      </Button>
                    </Link>
                  )}
                  {!hasEnded && !user && (
                    <AuthRequiredTrigger>
                      <Button className="w-full">
                        <Code2 className="h-4 w-4 mr-2" />
                        Start Coding
                      </Button>
                    </AuthRequiredTrigger>
                  )}

                  <Link href="/challenges" className="block">
                    <Button variant="outline" className="w-full bg-transparent">
                      Back to Challenges
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
