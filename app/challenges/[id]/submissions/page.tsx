"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Eye, User, Clock, CheckCircle, AlertCircle, Clock as ClockIcon } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { toast } from "sonner"

interface Submission {
  id: string
  userId: string
  code: string | null
  language: string | null
  fileUrl: string | null
  status: string
  score: number | null
  submittedAt: string
  reviewedAt: string | null
  user: {
    name: string | null
    email: string
  }
  reviewedBy: {
    name: string | null
    email: string
  } | null
}

interface Challenge {
  id: string
  title: string
  difficulty: string
  points: number
  timeLimit: number
  status: string
}

export default function ChallengeSubmissionsPage() {
  const params = useParams()
  const challengeId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch challenge details
        const challengeResponse = await fetch(`/api/challenges/${challengeId}`)
        if (!challengeResponse.ok) {
          throw new Error("Failed to fetch challenge")
        }
        const challengeData = await challengeResponse.json()
        setChallenge(challengeData.challenge)

        // Fetch submissions
        const submissionsResponse = await fetch(`/api/challenges/${challengeId}/submissions`)
        if (!submissionsResponse.ok) {
          throw new Error("Failed to fetch submissions")
        }
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData.submissions)

      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load challenge data")
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchData()
    }
  }, [challengeId])

  const getSubmissionStatus = (status: string) => {
    const statusConfig = {
      ACCEPTED: { icon: CheckCircle, variant: "secondary" as const, text: "Accepted", color: "text-green-600" },
      REJECTED: { icon: AlertCircle, variant: "destructive" as const, text: "Rejected", color: "text-red-600" },
      PENDING: { icon: ClockIcon, variant: "default" as const, text: "Pending Review", color: "text-yellow-600" },
      WRONG_ANSWER: { icon: AlertCircle, variant: "destructive" as const, text: "Wrong Answer", color: "text-red-600" },
      RUNTIME_ERROR: { icon: AlertCircle, variant: "destructive" as const, text: "Runtime Error", color: "text-red-600" },
      COMPILATION_ERROR: { icon: AlertCircle, variant: "destructive" as const, text: "Compilation Error", color: "text-red-600" },
      TIME_LIMIT_EXCEEDED: { icon: AlertCircle, variant: "destructive" as const, text: "Time Limit Exceeded", color: "text-red-600" },
    }

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
  }

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === "all") return true
    return submission.status === filter
  })

  const stats = {
    total: submissions.length,
    accepted: submissions.filter(s => s.status === "ACCEPTED").length,
    pending: submissions.filter(s => s.status === "PENDING").length,
    rejected: submissions.filter(s => s.status === "REJECTED").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading submissions...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/challenges/manage" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manage Challenges
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">Challenge Submissions</h1>
              {challenge && (
                <div className="flex items-center gap-3">
                  <p className="text-muted-foreground">{challenge.title}</p>
                  <Badge variant={
                    challenge.difficulty === "EASY" ? "secondary" :
                    challenge.difficulty === "MEDIUM" ? "default" : "destructive"
                  }>
                    {challenge.difficulty}
                  </Badge>
                  <Badge variant="outline">{challenge.points} points</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total Submissions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                {[
                  { key: "all", label: "All Submissions" },
                  { key: "PENDING", label: "Pending" },
                  { key: "ACCEPTED", label: "Accepted" },
                  { key: "REJECTED", label: "Rejected" },
                ].map((filterOption) => (
                  <Button
                    key={filterOption.key}
                    variant={filter === filterOption.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(filterOption.key)}
                  >
                    {filterOption.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
              <CardDescription>
                All submissions for this challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No submissions found for the selected filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((submission) => {
                    const statusConfig = getSubmissionStatus(submission.status)
                    const StatusIcon = statusConfig.icon

                    return (
                      <Card key={submission.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {submission.user.name || submission.user.email.split('@')[0]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                                  <Badge variant={statusConfig.variant} className="text-xs">
                                    {statusConfig.text}
                                  </Badge>
                                </div>
                                {submission.score !== null && (
                                  <Badge variant="outline" className="text-xs">
                                    {submission.score}/{challenge?.points} points
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                <div>
                                  <span>Submitted:</span>
                                  <p className="font-medium text-foreground">
                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                {submission.language && (
                                  <div>
                                    <span>Language:</span>
                                    <p className="font-medium text-foreground">{submission.language}</p>
                                  </div>
                                )}
                                {submission.reviewedAt && (
                                  <div>
                                    <span>Reviewed:</span>
                                    <p className="font-medium text-foreground">
                                      {new Date(submission.reviewedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {submission.reviewedBy && (
                                  <div>
                                    <span>Reviewed by:</span>
                                    <p className="font-medium text-foreground">
                                      {submission.reviewedBy.name || submission.reviewedBy.email.split('@')[0]}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {submission.code && (
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Code
                                </Button>
                              )}
                              {submission.fileUrl && (
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
