/**
 * Dashboard Client Component - Refactorized
 * Client Component que maneja la UI e interacciones del dashboard
 * Diseño completamente diferente a Profile, enfocado en overview y progreso
 */

"use client"

import React from 'react'
import { DashboardNav } from "@/components/dashboard-nav"
import { RoleOnboardingModal } from "@/components/role-onboarding-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, Target, Code2, Star, Zap, ArrowRight, Clock, Users, TrendingUp, 
  Flame, Award, Zap as Lightning, CheckCircle2, AlertCircle, ChevronRight,
  BarChart3, Activity, Sparkles
} from "lucide-react"
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

// Metric Card con animación
const MetricCard: React.FC<{
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  trend?: number
  color?: 'primary' | 'success' | 'warning' | 'destructive'
}> = ({ title, value, subtitle, icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    success: 'text-green-600 bg-green-50 dark:bg-green-950',
    warning: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
    destructive: 'text-red-600 bg-red-50 dark:bg-red-950'
  }
  
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend !== undefined && (
            <span className={`text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Active Challenge Card - Enhanced
const ActiveChallengeCard: React.FC<{
  challenge: Challenge
  t: (key: string) => string
}> = ({ challenge, t }) => (
  <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/50">
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-tight mb-2">{challenge.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
          </div>
          <Badge variant={getBadgeVariant.difficulty(challenge.difficulty)}>
            {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{challenge.points}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{challenge.timeLimit}</p>
            <p className="text-xs text-muted-foreground">Min</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{challenge._count?.submissions || 0}</p>
            <p className="text-xs text-muted-foreground">Soluciones</p>
          </div>
        </div>

        <Link href={`/challenges/${challenge.id}`} className="w-full">
          <Button className="w-full" size="sm" variant="default">
            {t("dashboard.startChallenge")} <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
)

// Recent Achievement Item
const AchievementItem: React.FC<{
  submission: Submission
  t: (key: string) => string
}> = ({ submission, t }) => {
  const isAccepted = submission.status === 'ACCEPTED'
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-full ${isAccepted ? 'bg-green-100' : 'bg-amber-100'}`}>
        {isAccepted ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{submission.challenge.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate.relative(submission.submittedAt)}
        </p>
      </div>
      <div className="text-right">
        <Badge 
          variant={getBadgeVariant.status(submission.status)}
          className="text-xs"
        >
          {getStatusText(submission.status, t)}
        </Badge>
        {submission.score && (
          <p className="text-xs text-muted-foreground mt-1">{submission.score}%</p>
        )}
      </div>
    </div>
  )
}

// Main Dashboard Client Component
export const DashboardClient: React.FC<DashboardClientProps> = ({
  user,
  authUser,
  stats,
  activeChallenges,
  recentSubmissions,
  translations
}) => {
  const [showRoleModal, setShowRoleModal] = React.useState(!user.role)
  const [currentUser, setCurrentUser] = React.useState(user)
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  const successRate = stats.totalSubmissions > 0 
    ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) 
    : 0

  const handleRoleSelected = (role: "CREATOR" | "PARTICIPANT") => {
    console.log("Role selected:", role)
    // Update local state
    setCurrentUser({
      ...currentUser,
      role: role as any
    })
    setShowRoleModal(false)
    
    // Refresh page to see updated role and navigation
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Show role selection modal if user doesn't have a role */}
      {showRoleModal && (
        <RoleOnboardingModal onRoleSelected={handleRoleSelected} />
      )}

      {/* Only show dashboard content if user has a role */}
      {currentUser.role && (
        <>
          <DashboardNav 
            userRole={user.role}
            userName={user.name}
            userEmail={user.email}
            userImage={authUser.user_metadata?.avatar_url}
          />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section - Compact */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t("dashboard.welcome")}, {user.name || "Developer"}!
              </h1>
              <p className="text-muted-foreground">
                {t("dashboard.readyForChallenge")}
              </p>
            </div>
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage 
                src={authUser.user_metadata?.avatar_url || ""} 
                alt={user.name || "User"} 
              />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Key Metrics - 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard 
            title={t("dashboard.totalPoints") || "Total Points"}
            value={stats.totalPoints || 0}
            subtitle={`From ${stats.totalSubmissions} submissions`}
            icon={<Trophy className="h-5 w-5" />}
            color="primary"
          />
          <MetricCard 
            title={t("dashboard.submissions") || "Submissions"}
            value={stats.totalSubmissions || 0}
            subtitle={`${stats.acceptedSubmissions || 0} accepted`}
            icon={<Code2 className="h-5 w-5" />}
            color="success"
            trend={stats.acceptedSubmissions && stats.totalSubmissions ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) : 0}
          />
          <MetricCard 
            title={t("dashboard.successRate") || "Success Rate"}
            value={successRate}
            subtitle="Acceptance ratio"
            icon={<Target className="h-5 w-5" />}
            color="warning"
          />
          <MetricCard 
            title={t("dashboard.avgScore") || "Avg Score"}
            value={stats.averageScore || 0}
            subtitle="Out of 100"
            icon={<Star className="h-5 w-5" />}
            color="success"
          />
        </div>

        {/* Tabs - Active Challenges & Recent Activity */}
        <Tabs defaultValue="challenges" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              {t("dashboard.activeChallenges") || "Active Challenges"}
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              {t("dashboard.recentActivity") || "Recent Activity"}
            </TabsTrigger>
          </TabsList>

          {/* Active Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            {activeChallenges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeChallenges.slice(0, 3).map((challenge) => (
                  <ActiveChallengeCard 
                    key={challenge.id} 
                    challenge={challenge} 
                    t={t} 
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Lightning className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="font-medium mb-1">{t("dashboard.noChallenges") || "No challenges available"}</p>
                    <p className="text-sm text-muted-foreground mb-4">{t("dashboard.checkBackLater") || "Check back soon!"}</p>
                    <Link href="/challenges">
                      <Button size="sm" variant="outline">
                        Browse All Challenges
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="achievements" className="space-y-3">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((submission) => (
                <AchievementItem 
                  key={submission.id} 
                  submission={submission} 
                  t={t} 
                />
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="font-medium mb-1">{t("dashboard.noSubmissionsYet") || "No submissions yet"}</p>
                    <p className="text-sm text-muted-foreground mb-4">{t("dashboard.startFirst") || "Complete your first challenge!"}</p>
                    <Link href="/challenges">
                      <Button size="sm">
                        Start a Challenge
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Explore Challenges */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">{t("dashboard.exploreChallenges") || "Explore Challenges"}</h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.exploreChallengesDesc") || "Browse and filter challenges by difficulty and category"}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <Link href="/challenges">
                <Button className="mt-4" size="sm" variant="outline">
                  {t("dashboard.viewAll") || "View All"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* View Leaderboard */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">{t("dashboard.leaderboard") || "Leaderboard"}</h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.leaderboardDesc") || "Compete with others and see where you rank"}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <Link href="/leaderboard">
                <Button className="mt-4" size="sm" variant="outline">
                  {t("dashboard.viewLeaderboard") || "Check Ranking"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Your Profile */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">{t("dashboard.yourProfile") || "Your Profile"}</h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.yourProfileDesc") || "View and edit your profile information"}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <Link href="/profile">
                <Button className="mt-4" size="sm" variant="outline">
                  {t("dashboard.profile") || "View Profile"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">{t("dashboard.statistics") || "Statistics"}</h3>
                  <p className="text-sm text-muted-foreground">{t("dashboard.statisticsDesc") || "Detailed breakdown of your progress"}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points</span>
                  <span className="font-bold">{stats.totalPoints || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success</span>
                  <span className="font-bold">{successRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
        </>
      )}
    </div>
  )
}
