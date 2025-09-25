"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Users, CheckCircle, Clock, BarChart3 } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { toast } from "sonner"
import { useTranslations } from "@/lib/i18n"

interface Challenge {
  id: string
  title: string
  difficulty: string
  points: number
  timeLimit: number
  status: string
  createdAt: string
}

interface Analytics {
  totalSubmissions: number
  uniqueParticipants: number
  acceptedSubmissions: number
  averageScore: number
  submissionsByDay: { date: string; count: number }[]
  statusDistribution: { status: string; count: number }[]
  difficultyMetrics: {
    averageAttempts: number
    successRate: number
  }
}

export default function ChallengeAnalyticsPage() {
  const params = useParams()
  const challengeId = params.id as string
  const t = useTranslations()
  
  const [loading, setLoading] = useState(true)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

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

        // Fetch analytics
        const analyticsResponse = await fetch(`/api/challenges/${challengeId}/analytics`)
        if (!analyticsResponse.ok) {
          throw new Error("Failed to fetch analytics")
        }
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData.analytics)

      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error(t("analytics.loadError"))
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchData()
    }
  }, [challengeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t("analytics.loading")}</p>
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
              {t("analytics.backToManage")}
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("analytics.title")}</h1>
              {challenge && (
                <div className="flex items-center gap-3">
                  <p className="text-muted-foreground">{challenge.title}</p>
                  <Badge variant={
                    challenge.difficulty === "EASY" ? "secondary" :
                    challenge.difficulty === "MEDIUM" ? "default" : "destructive"
                  }>
                    {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
                  </Badge>
                  <Badge variant="outline">{challenge.points} {t("challenges.details.points")}</Badge>
                </div>
              )}
            </div>
          </div>

          {analytics ? (
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
                    <div className="text-2xl font-bold">
                      {analytics.totalSubmissions > 0 
                        ? Math.round((analytics.acceptedSubmissions / analytics.totalSubmissions) * 100)
                        : 0}%
                    </div>
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
                      {t("analytics.outOf", { points: challenge?.points?.toString() || "0" })}
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
                      const percentage = analytics.totalSubmissions > 0 
                        ? (item.count / analytics.totalSubmissions) * 100 
                        : 0

                      return (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              item.status === "ACCEPTED" ? "secondary" :
                              item.status === "PENDING" ? "default" :
                              "destructive"
                            }>
                              {t(`submissions.status.${item.status.toLowerCase()}`)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.count}</span>
                            <span className="text-xs text-muted-foreground">
                              ({Math.round(percentage)}%)
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
                      <Badge variant={
                        challenge?.difficulty === "EASY" ? "secondary" :
                        challenge?.difficulty === "MEDIUM" ? "default" : "destructive"
                      }>
                        {challenge?.difficulty ? t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`) : ""}
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
                        {analytics.submissionsByDay.slice(0, 7).map((day) => (
                          <div key={day.date} className="flex justify-between items-center">
                            <span className="text-sm">
                              {new Date(day.date).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{day.count}</span>
                              <div className="w-12 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min((day.count / Math.max(...analytics.submissionsByDay.map(d => d.count))) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("analytics.noActivityYet")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </main>
    </div>
  )
}
