/**
 * Leaderboard Client Component - Refactorized
 * Client Component que maneja la UI del leaderboard
 */

"use client"

import React from 'react'
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LeaderboardTabs } from "@/components/leaderboard-tabs"
import { Trophy, Users, Target, TrendingUp, Crown, Medal, Award, Flame, Zap } from "lucide-react"
// Helper function for client-side translation
function translate(translations: Record<string, any>, key: string, params?: Record<string, any>): string {
  const keys = key.split('.')
  let value: any = translations
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  if (typeof value !== 'string') return key
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
      value
    )
  }
  
  return value
}
import { formatNumber } from "@/lib/utils/index"
import type { LeaderboardUser, GlobalStats } from "@/lib/services/leaderboard.service"

// Component Props Interface
interface LeaderboardClientProps {
  leaderboardData: LeaderboardUser[]
  stats: GlobalStats
  translations: Record<string, any>
}

// Leaderboard Item Component
const LeaderboardItem: React.FC<{
  user: LeaderboardUser
  isTopThree: boolean
  t: (key: string) => string
}> = ({ user, isTopThree, t }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />
      case 2: return <Medal className="h-6 w-6 text-gray-400" />
      case 3: return <Award className="h-6 w-6 text-amber-600" />
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return "🥇"
      case 2: return "🥈"
      case 3: return "🥉"
      default: return null
    }
  }

  if (isTopThree) {
    return (
      <div className="flex items-center gap-6 p-6 glass-card liquid-border-lg glass-elevated-lg mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {getRankIcon(user.rank)}
            {getRankBadge(user.rank) && (
              <div className="absolute -top-2 -right-2 text-lg">
                {getRankBadge(user.rank)}
              </div>
            )}
          </div>
          <Avatar className="h-12 w-12 liquid-border glass-elevated">
            <AvatarImage src={user.image || ""} alt={user.name || user.email} />
            <AvatarFallback className="font-bold">
              {user.name?.charAt(0) || user.email.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg">{user.name || user.email.split('@')[0]}</h3>
            <Badge variant="secondary" className="text-xs capitalize">
              {t(`profile.roles.${user.role.toLowerCase()}`)}
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{user.points}</p>
            <p className="text-xs text-muted-foreground">{t("leaderboard.points")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{user.acceptedSubmissions}</p>
            <p className="text-xs text-muted-foreground">{t("leaderboard.solved")}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{user.successRate}%</p>
            <p className="text-xs text-muted-foreground">{t("leaderboard.successRate")}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6 p-4 hover:glass-card transition-all duration-200 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-8 text-center">
          <span className="text-lg font-bold text-muted-foreground">#{user.rank}</span>
        </div>
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.image || ""} alt={user.name || user.email} />
          <AvatarFallback>
            {user.name?.charAt(0) || user.email.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{user.name || user.email.split('@')[0]}</p>
          <Badge variant="outline" className="text-xs capitalize">
            {t(`profile.roles.${user.role.toLowerCase()}`)}
          </Badge>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-8 text-sm">
        <span className="font-bold text-primary">{user.points}</span>
        <span className="font-medium">{user.acceptedSubmissions}</span>
        <span className="font-medium">{user.successRate}%</span>
      </div>
    </div>
  )
}

/**
 * Main Leaderboard Client Component
 * Muestra rankings y estadísticas globales
 */
export const LeaderboardClient: React.FC<LeaderboardClientProps> = ({
  leaderboardData,
  stats,
  translations
}) => {
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  const topThree = leaderboardData.slice(0, 3)
  const rest = leaderboardData.slice(3)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-12">
        {/* Header with Colorful Background */}
        <div className="mb-12 bg-white dark:bg-slate-950 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-950 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                {t("leaderboard.title")}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              {t("leaderboard.description")}
            </p>
          </div>

          {/* Stats Overview - Colorful */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("leaderboard.totalUsers") || "Total Users"}</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber.compact(stats.totalUsers)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("leaderboard.totalChallenges") || "Challenges"}</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber.compact(stats.totalChallenges)}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("leaderboard.totalSubmissions") || "Submissions"}</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber.compact(stats.totalSubmissions)}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("leaderboard.activeUsers") || "Active Users"}</p>
                    <p className="text-2xl font-bold text-primary">{formatNumber.compact(stats.activeUsers)}</p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
                    <Flame className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <Card className="glass-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Trophy className="h-6 w-6 text-primary" />
                  {t("leaderboard.rankings")}
                </CardTitle>

              </div>
              <CardDescription className="text-base">
                {t("leaderboard.topPerformers")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboardData.length > 0 ? (
                <div className="space-y-1">
                  {/* Top 3 with special styling */}
                  {topThree.map((user) => (
                    <LeaderboardItem
                      key={user.id}
                      user={user}
                      isTopThree={true}
                      t={t}
                    />
                  ))}

                  {/* Rest of the leaderboard */}
                  {rest.length > 0 && (
                    <div className="pt-4 space-y-1">
                      {rest.map((user) => (
                        <LeaderboardItem
                          key={user.id}
                          user={user}
                          isTopThree={false}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">
                    {t("leaderboard.noData")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("leaderboard.startCompeting")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        {leaderboardData.length > 0 && (
          <div className="text-center mt-12">
            <Card className="max-w-md mx-auto glass-card">
              <CardContent className="p-6">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("leaderboard.joinCompetition")}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t("leaderboard.climbRanks")}
                </p>
                <Button asChild className="liquid-border">
                  <a href="/challenges">
                    {t("leaderboard.startChallenges")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
