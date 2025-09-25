"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Clock, Users, Target, Calendar, CheckCircle, AlertCircle, Clock as ClockIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n"

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
  const t = useTranslations()
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
      ACCEPTED: { icon: CheckCircle, variant: "secondary" as const, text: t("submissions.status.accepted"), color: "text-green-600" },
      REJECTED: { icon: AlertCircle, variant: "destructive" as const, text: t("submissions.status.rejected"), color: "text-red-600" },
      PENDING: { icon: ClockIcon, variant: "default" as const, text: t("submissions.status.pending"), color: "text-yellow-600" },
      WRONG_ANSWER: { icon: AlertCircle, variant: "destructive" as const, text: t("submissions.status.wrongAnswer"), color: "text-red-600" },
      RUNTIME_ERROR: { icon: AlertCircle, variant: "destructive" as const, text: t("submissions.status.runtimeError"), color: "text-red-600" },
      COMPILATION_ERROR: { icon: AlertCircle, variant: "destructive" as const, text: t("submissions.status.compilationError"), color: "text-red-600" },
      TIME_LIMIT_EXCEEDED: { icon: AlertCircle, variant: "destructive" as const, text: t("submissions.status.timeLimitExceeded"), color: "text-red-600" },
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
    <Card className="h-full glass-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-3 text-balance leading-tight">{challenge.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  challenge.difficulty === "EASY"
                    ? "secondary"
                    : challenge.difficulty === "MEDIUM"
                      ? "default"
                      : "destructive"
                }
                className="liquid-border text-xs"
              >
                {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
              </Badge>
              <Badge variant="outline" className="text-xs liquid-border">
                <Trophy className="h-3 w-3 mr-1" />
                {challenge.points} pts
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed line-clamp-2 mb-4">{challenge.description}</CardDescription>
        
        {/* Submission Status */}
        {!loading && getSubmissionBadge()}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Challenge Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 p-2 bg-muted/30 liquid-border">
              <Clock className="h-3 w-3" />
              <span>{challenge.timeLimit}m</span>
            </div>
            <div className="flex items-center gap-1 p-2 bg-muted/30 liquid-border">
              <Users className="h-3 w-3" />
              <span>{challenge._count.submissions}</span>
            </div>
            <div className="flex items-center gap-1 p-2 bg-muted/30 liquid-border">
              <Calendar className="h-3 w-3" />
              <span>{timeRemaining}d</span>
            </div>
          </div>

          {/* Creator Info */}
          <div className="text-xs text-muted-foreground">
            {t("challenges.details.createdBy")} {challenge.creator?.name || t("common.anonymous")}
          </div>
          
          {/* Action Buttons */}
          <div className="pt-8">
            {submission ? (
              <div>
                <Link href={`/challenges/${challenge.id}`}>
                  <Button size="sm" variant="outline" className="w-full liquid-border">
                    {t("challenges.details.viewDetails")}
                  </Button>
                </Link>
                {/* Solo mostrar botones de acción según el estado de la submission */}
                {((submission as any).isDraft || 
                 (submission.status === "WRONG_ANSWER" || 
                  submission.status === "RUNTIME_ERROR" || 
                  submission.status === "COMPILATION_ERROR" ||
                  submission.status === "TIME_LIMIT_EXCEEDED")) && (
                  <div className="mt-6">
                    <Link href={`/challenges/${challenge.id}/submit`}>
                      <Button size="sm" className="w-full liquid-border">
                        {(submission as any).isDraft ? t("challenges.details.continueDraft") : t("challenges.details.improveSolution")}
                      </Button>
                    </Link>
                  </div>
                )}
                {/* Para submissions aceptadas, mostrar un botón indicativo */}
                {submission.status === "ACCEPTED" && (
                  <div className="mt-6">
                    <Button size="sm" variant="secondary" disabled className="w-full liquid-border">
                      <CheckCircle className="h-3 w-3 mr-2" />
                      {t("challenges.details.completed")}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Link href={`/challenges/${challenge.id}`}>
                <Button size="sm" className="w-full liquid-border">
                  <Target className="h-3 w-3 mr-2" />
                  {t("challenges.details.startChallenge")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
