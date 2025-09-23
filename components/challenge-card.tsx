"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Clock, Users, Target, Calendar, CheckCircle, AlertCircle, Clock as ClockIcon } from "lucide-react"
import Link from "next/link"

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  timeLimit: number
  endDate: Date | string
  creator: {
    name: string | null
  } | null
  _count: {
    submissions: number
  }
}

interface Submission {
  id: string
  status: string
  score: number | null
  submittedAt: string
}

interface ChallengeCardProps {
  challenge: Challenge
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions?challengeId=${challenge.id}`)
        if (response.ok) {
          const data = await response.json()
          setSubmission(data.submission)
        }
      } catch (error) {
        console.error("Error fetching submission:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmission()
  }, [challenge.id])

  const timeRemaining = Math.max(
    0,
    Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  const getSubmissionBadge = () => {
    if (!submission) return null

    const statusConfig = {
      ACCEPTED: { icon: CheckCircle, variant: "secondary" as const, text: "Accepted", color: "text-green-600" },
      PENDING: { icon: ClockIcon, variant: "default" as const, text: "Pending Review", color: "text-yellow-600" },
      WRONG_ANSWER: { icon: AlertCircle, variant: "destructive" as const, text: "Wrong Answer", color: "text-red-600" },
      RUNTIME_ERROR: { icon: AlertCircle, variant: "destructive" as const, text: "Runtime Error", color: "text-red-600" },
      COMPILATION_ERROR: { icon: AlertCircle, variant: "destructive" as const, text: "Compilation Error", color: "text-red-600" },
      TIME_LIMIT_EXCEEDED: { icon: AlertCircle, variant: "destructive" as const, text: "Time Limit Exceeded", color: "text-red-600" },
    }

    const config = statusConfig[submission.status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <div className="flex items-center gap-2 mt-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <Badge variant={config.variant} className="text-xs">
          {config.text}
        </Badge>
        {submission.score && (
          <span className="text-xs text-muted-foreground">
            {submission.score}/100
          </span>
        )}
      </div>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 text-balance">{challenge.title}</CardTitle>
            <div className="flex items-center gap-2 mb-3">
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
              <Badge variant="outline" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                {challenge.points} pts
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="text-pretty line-clamp-3">{challenge.description}</CardDescription>
        
        {/* Submission Status */}
        {!loading && getSubmissionBadge()}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {challenge.timeLimit} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {challenge._count.submissions} submissions
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {timeRemaining}d left
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                by {challenge.creator?.name || "Anonymous"}
              </div>
            </div>
            
            {submission ? (
              <div className="flex gap-2">
                <Link href={`/challenges/${challenge.id}`}>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </Link>
                {/* Solo mostrar "Improve Solution" para borradores o submissions fallidas */}
                {((submission as any).isDraft || 
                 (submission.status === "WRONG_ANSWER" || 
                  submission.status === "RUNTIME_ERROR" || 
                  submission.status === "COMPILATION_ERROR" ||
                  submission.status === "TIME_LIMIT_EXCEEDED")) && (
                  <Link href={`/challenges/${challenge.id}/submit`}>
                    <Button size="sm" variant="secondary">
                      {(submission as any).isDraft ? "Continue Draft" : "Improve Solution"}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Link href={`/challenges/${challenge.id}`}>
                <Button size="sm">
                  <Target className="h-3 w-3 mr-1" />
                  Start Challenge
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
