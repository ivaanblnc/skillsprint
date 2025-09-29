"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Users, CheckCircle, Clock, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n"
import { Challenge, Analytics } from "@/lib/types"
import { AnalyticsService } from "@/lib/services/analytics.service"

interface ChallengeAnalyticsClientProps {
  challenge: Challenge
  analytics: Analytics | null
}

export function ChallengeAnalyticsClient({ challenge, analytics }: ChallengeAnalyticsClientProps) {
  const t = useTranslations()

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "secondary"
      case "PENDING":
        return "default"
      default:
        return "destructive"
    }
  }

  if (!analytics) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/challenges/manage" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("analytics.backToManage")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("analytics.title")}</h1>
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground">{challenge.title}</p>
              <Badge variant={getDifficultyVariant(challenge.difficulty)}>
                {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
              </Badge>
              <Badge variant="outline">{challenge.points} {t("challenges.details.points")}</Badge>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{t("analytics.noAnalyticsAvailable")}</h3>
              <p className="text-muted-foreground">
                {t("analytics.analyticsAvailableOnceSubmissions")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const successRate = AnalyticsService.calculateSuccessRate(analytics)
  const maxSubmissionCount = AnalyticsService.getMaxSubmissionCount(analytics.submissionsByDay)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/challenges/manage" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("analytics.backToManage")}
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("analytics.title")}</h1>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">{challenge.title}</p>
            <Badge variant={getDifficultyVariant(challenge.difficulty)}>
              {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
            </Badge>
            <Badge variant="outline">{challenge.points} {t("challenges.details.points")}</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.totalSubmissions")}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                {t("analytics.allSubmissionsReceived")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.participants")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.uniqueParticipants}</div>
              <p className="text-xs text-muted-foreground">
                {t("analytics.uniqueParticipants")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.successRate")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.acceptedSubmissions} {t("analytics.accepted")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.averageScore")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.averageScore ? Math.round(analytics.averageScore) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("analytics.outOf", { points: challenge.points.toString() })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.statusDistribution")}</CardTitle>
            <CardDescription>
              {t("analytics.statusBreakdown")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.statusDistribution.map((item) => {
                const percentage = AnalyticsService.calculateStatusPercentage(item.count, analytics.totalSubmissions)

                return (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(item.status)}>
                        {t(`submissions.status.${item.status.toLowerCase()}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({percentage}%)
                      </span>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Challenge Performance */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.challengePerformance")}</CardTitle>
              <CardDescription>
                {t("analytics.howParticipantsPerforming")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t("analytics.successRate")}:</span>
                <span className="font-medium">
                  {Math.round(analytics.difficultyMetrics.successRate)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t("analytics.averageAttempts")}:</span>
                <span className="font-medium">
                  {analytics.difficultyMetrics.averageAttempts.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t("analytics.difficultyRating")}:</span>
                <Badge variant={getDifficultyVariant(challenge.difficulty)}>
                  {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.recentActivity")}</CardTitle>
              <CardDescription>
                {t("analytics.submissionActivityOverTime")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.submissionsByDay.length > 0 ? (
                <div className="space-y-2">
                  {analytics.submissionsByDay.slice(0, 7).map((day) => {
                    const activityPercentage = AnalyticsService.formatActivityPercentage(day.count, maxSubmissionCount)

                    return (
                      <div key={day.date} className="flex justify-between items-center">
                        <span className="text-sm">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{day.count}</span>
                          <div className="w-12 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${activityPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("analytics.noActivityYet")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
