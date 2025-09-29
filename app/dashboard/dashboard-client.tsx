/**
 * Dashboard Client Component - Refactorized
 * Client Component que maneja la UI y interacciones
 */

"use client"

import React from 'react'
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, Code2, Star, Zap, ArrowRight, Clock, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { translate } from "@/lib/i18n-helpers"
import { getBadgeVariant, getStatusText, formatDate } from "@/lib/utils/index"
import type { User, DashboardStats, Challenge, Submission } from "@/lib/types"
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Component Props Interface
interface DashboardClientProps {
  user: User
  authUser: SupabaseUser
  stats: DashboardStats
  activeChallenges: Challenge[]
  recentSubmissions: Submission[]
  translations: Record<string, any>
}

// Reusable Stats Card Component
const StatsCard: React.FC<{
  title: string
  value?: number
  description?: string
  icon: React.ReactNode
  showProgress?: boolean
}> = ({ title, value, description, icon, showProgress = false }) => (
  <Card className="glass-elevated">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-base font-semibold">{title}</CardTitle>
      <div className="p-2 bg-primary/5 liquid-border">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold mb-2 text-primary">
        {value !== undefined ? (showProgress ? `${value}%` : value) : '-'}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground font-medium">{description}</p>
      )}
      {showProgress && value !== undefined && (
        <Progress value={value} className="mt-3 h-2" />
      )}
    </CardContent>
  </Card>
)

// Challenge Card Component
const ChallengeCard: React.FC<{
  challenge: Challenge
  t: (key: string) => string
}> = ({ challenge, t }) => (
  <div className="flex items-center justify-between p-6 glass-card liquid-border-lg glass-elevated">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-semibold text-lg">{challenge.title}</h3>
        <Badge
          variant={getBadgeVariant.difficulty(challenge.difficulty)}
          className="liquid-border"
        >
          {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-muted-foreground text-sm">
        <span className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-primary" />
          {challenge.points} pts
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-primary" />
          {challenge.timeLimit}min
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4 text-primary" />
          {challenge._count?.submissions || 0}
        </span>
      </div>
    </div>
    <Link href={`/challenges/${challenge.id}`}>
      <Button size="lg" className="liquid-border">
        {t("dashboard.startChallenge")}
      </Button>
    </Link>
  </div>
)

// Submission Item Component
const SubmissionItem: React.FC<{
  submission: Submission
  t: (key: string) => string
}> = ({ submission, t }) => (
  <div className="flex items-center justify-between p-4 glass-card liquid-border glass-elevated">
    <div className="flex-1">
      <p className="font-semibold text-base">{submission.challenge.title}</p>
      <div className="flex items-center gap-3 mt-2">
        <Badge
          variant={getBadgeVariant.status(submission.status)}
          className="liquid-border text-xs"
        >
          {getStatusText(submission.status, t)}
        </Badge>
        {submission.score && (
          <span className="text-xs text-muted-foreground font-medium">
            {submission.score}/100
          </span>
        )}
      </div>
    </div>
    <div className="text-xs text-muted-foreground font-medium">
      {formatDate.relative(submission.submittedAt)}
    </div>
  </div>
)

// Main Dashboard Client Component
export const DashboardClient: React.FC<DashboardClientProps> = ({
  user,
  authUser,
  stats,
  activeChallenges,
  recentSubmissions,
  translations
}) => {
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

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
              <p className="text-muted-foreground text-lg">
                {t("dashboard.readyForChallenge")}
              </p>
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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Challenges */}
          <Card className="glass-elevated h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-primary/5 liquid-border">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    {t("challenges.title")}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {t("dashboard.jumpIntoLive")}
                  </CardDescription>
                </div>
                <Link href="/challenges">
                  <Button variant="outline" size="lg" className="liquid-border">
                    {t("dashboard.viewAll")} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-6 h-full">
                {activeChallenges.length > 0 ? (
                  <div className="space-y-4">
                    {activeChallenges.slice(0, 3).map((challenge) => (
                      <ChallengeCard 
                        key={challenge.id} 
                        challenge={challenge} 
                        t={t} 
                      />
                    ))}
                  </div>
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

          {/* Right Column - Recent Activity & Quick Actions */}
          <div className="space-y-8 h-full">
            {/* Recent Activity */}
            <Card className="glass-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-primary/5 liquid-border">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  {t("dashboard.recentActivity")}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {t("dashboard.yourLatest")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSubmissions.length > 0 ? (
                    recentSubmissions.slice(0, 3).map((submission) => (
                      <SubmissionItem 
                        key={submission.id} 
                        submission={submission} 
                        t={t} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 glass-card liquid-border-lg glass-elevated">
                      <Code2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-base font-medium mb-1">
                        {t("dashboard.noSubmissionsYet")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("dashboard.startFirst")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-primary/5 liquid-border">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  {t("dashboard.quickActions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/challenges" className="block">
                  <Button variant="outline" className="w-full justify-start h-11 liquid-border">
                    <Target className="mr-3 h-4 w-4" /> {t("dashboard.browseChallenges")}
                  </Button>
                </Link>
                <Link href="/leaderboard" className="block">
                  <Button variant="outline" className="w-full justify-start h-11 liquid-border">
                    <Trophy className="mr-3 h-4 w-4" /> {t("dashboard.viewLeaderboard")}
                  </Button>
                </Link>
                {user.role === "CREATOR" && (
                  <>
                    <Link href="/challenges/create" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 liquid-border">
                        <Code2 className="mr-3 h-4 w-4" /> {t("dashboard.createChallenge")}
                      </Button>
                    </Link>
                    <Link href="/challenges/manage" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 liquid-border">
                        <Trophy className="mr-3 h-4 w-4" /> {t("dashboard.manageMyChallenges")}
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
}
