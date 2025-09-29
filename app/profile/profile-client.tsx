/**
 * Profile Client Component - Refactorized
 * Client Component que maneja la UI y edición del perfil
 */

"use client"

import React from 'react'
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Trophy, Mail, UserIcon, Calendar, Target, Code2, ArrowLeft, 
  Edit, Save, X, Loader2, CheckCircle, AlertCircle, Plus, BookOpen
} from "lucide-react"
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
import { useFormState, useAsyncState } from "@/lib/hooks"
import { validation, formatDate } from "@/lib/utils/index"
import { createUserService } from "@/lib/services/user.service"
import { createClient } from "@/lib/supabase/client"
import type { User, UserStats, ProfileFormData, UserActivity } from "@/lib/types"
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Component Props Interface
interface ProfileClientProps {
  user: User
  authUser: SupabaseUser
  stats: UserStats
  recentActivity: UserActivity[]
  translations: Record<string, any>
}

// Activity Item Component
const ActivityItem: React.FC<{
  activity: UserActivity
  t: (key: string) => string
}> = ({ activity, t }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'submission':
        return <Code2 className="h-4 w-4" />
      case 'challenge_created':
        return <Trophy className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getActivityColor = () => {
    if (activity.type === 'submission') {
      switch (activity.status) {
        case 'ACCEPTED': return 'text-green-600'
        case 'WRONG_ANSWER': return 'text-red-600'
        case 'TIME_LIMIT_EXCEEDED': return 'text-yellow-600'
        case 'RUNTIME_ERROR': return 'text-red-600'
        default: return 'text-blue-600'
      }
    }
    return 'text-purple-600'
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className={`p-2 rounded-full bg-muted ${getActivityColor()}`}>
        {getActivityIcon()}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{activity.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
        {activity.challenge && (
          <div className="flex items-center gap-2 mt-2">
            <Link 
              href={`/challenges/${activity.challenge.id}`}
              className="text-xs text-primary hover:underline"
            >
              Ver desafío
            </Link>
            {activity.metadata?.score && (
              <span className="text-xs text-muted-foreground">
                • {activity.metadata.score} pts
              </span>
            )}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {formatTimeAgo(activity.date)}
      </span>
    </div>
  )
}

/**
 * Main Profile Client Component
 * Maneja edición de perfil y visualización de estadísticas
 */
export const ProfileClient: React.FC<ProfileClientProps> = ({
  user,
  authUser,
  stats,
  recentActivity,
  translations
}) => {
  const t = (key: string, params?: Record<string, string>) => 
    translate(translations, key, params)

  // Form state for profile editing
  const {
    values: formData,
    errors,
    setValue,
    validate,
    reset,
    hasErrors
  } = useFormState<ProfileFormData>(
    {
      name: user.name || '',
      email: user.email
    },
    {
      name: (value) => !validation.required(value) ? t("profile.errors.nameRequired") : null,
      email: (value) => {
        if (!validation.required(value)) return t("profile.errors.emailRequired")
        if (!validation.email(value)) return t("profile.errors.emailInvalid")
        return null
      }
    }
  )

  // Async state for save operation
  const { loading: saving, execute: executeSave } = useAsyncState<any>(null)

  // UI state
  const [isEditing, setIsEditing] = React.useState(false)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Clear messages after timeout
  React.useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const handleEdit = () => {
    setIsEditing(true)
    setSuccess(null)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    reset()
    setError(null)
  }

  const handleSave = async () => {
    if (!validate()) {
      setError(t("profile.errors.fixErrors"))
      return
    }

    try {
      const supabase = createClient()
      const userService = createUserService(supabase)
      
      await executeSave(async () => {
        const result = await userService.updateUserProfile(user.id, formData)
        
        if (!result.success) {
          throw new Error(result.error || t("profile.errors.updateFailed"))
        }

        setSuccess(t("profile.success.updated"))
        setIsEditing(false)
        return result.data
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.errors.updateFailed"))
    }
  }

  const successRate = stats.totalSubmissions > 0 
    ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("profile.backToDashboard")}
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {t("profile.title")}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {t("profile.description")}
                </p>
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column - Profile Info & Quick Actions */}
            <div className="lg:col-span-4 space-y-6">
              {/* Profile Card */}
              <Card className="overflow-visible border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="space-y-4">
                    {/* Header with Edit Button */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="text-lg font-semibold flex-1">{t("profile.profileInfo")}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="hover:bg-primary/10 flex-shrink-0"
                      >
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t("profile.editProfile")}</span>
                      </Button>
                    </div>
                    
                    {/* Profile Content */}
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <Avatar className="h-20 w-20 ring-4 ring-primary/20 flex-shrink-0 mx-auto sm:mx-0">
                        <AvatarImage 
                          src={user.image || authUser.user_metadata?.avatar_url} 
                          alt={user.name || "User"} 
                        />
                        <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                          {(user.name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                        <h2 className="text-lg sm:text-xl font-bold break-words hyphens-auto leading-tight">
                          {user.name || "Usuario"}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1 break-words hyphens-auto">
                          {user.email}
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                          <span className="text-xs sm:text-sm bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full">
                            {t(`profile.roles.${user.role?.toLowerCase() || 'participant'}`)}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            #{stats.rank} {t("profile.outOf")} {stats.totalUsers}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {t("profile.memberSince")} {formatDate.long(user.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {stats.totalPoints} {t("profile.totalPointsText")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {t("profile.quickActions")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/challenges">
                    <Button className="w-full justify-start" variant="outline">
                      <Code2 className="h-4 w-4 mr-2" />
                      {t("profile.exploreChallenge")}
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button className="w-full justify-start" variant="outline">
                      <Trophy className="h-4 w-4 mr-2" />
                      {t("profile.viewLeaderboard")}
                    </Button>
                  </Link>
                  {(user.role === 'CREATOR' || user.role === 'ADMIN') && (
                    <>
                      <Link href="/challenges/create">
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          {t("profile.createNewChallenge")}
                        </Button>
                      </Link>
                      <Link href="/challenges/manage">
                        <Button className="w-full justify-start" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          {t("profile.manageChallenges")}
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>



              {/* Learning Path */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {t("profile.learningPath")}
                  </CardTitle>
                  <CardDescription>{t("profile.learningPathDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Skill Areas Assessment */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">{t("profile.skillAreas")}</h4>
                      
                      {/* Algorithm & Data Structures */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">{t("profile.algorithmsDataStructures")}</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.max(Math.min(Math.floor((stats.acceptedSubmissions / 3) * 100), 100), 15)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
                            style={{ width: `${Math.max(Math.min((stats.acceptedSubmissions / 3) * 100, 100), 15)}%` }}
                          />
                        </div>
                      </div>

                      {/* Web Development */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">{t("profile.webDevelopment")}</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.max(Math.min(Math.floor((stats.totalSubmissions / 5) * 100), 100), 10)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                            style={{ width: `${Math.max(Math.min((stats.totalSubmissions / 5) * 100, 100), 10)}%` }}
                          />
                        </div>
                      </div>

                      {/* Database Queries */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">{t("profile.databaseQueries")}</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.max(Math.min(Math.floor((stats.totalChallengesCompleted / 2) * 100), 100), 5)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700"
                            style={{ width: `${Math.max(Math.min((stats.totalChallengesCompleted / 2) * 100, 100), 5)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recommended Challenges or Next Steps */}
                    <div className="border-t pt-4">
                      {stats.totalSubmissions > 0 ? (
                        <>
                          <h4 className="text-sm font-medium mb-3">{t("profile.nextSteps")}</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg text-xs">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span>{t("profile.practiceMore")}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>{t("profile.exploreAdvanced")}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>{t("profile.joinCommunity")}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <h4 className="text-sm font-medium mb-1">{t("profile.learningPathEmptyTitle")}</h4>
                          <p className="text-xs text-muted-foreground">
                            {t("profile.learningPathEmptyDesc")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Stats & Activity */}
            <div className="lg:col-span-8 space-y-6">
              {/* Stats Overview Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-blue-500/10 rounded-full">
                        <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.totalPoints}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {t("profile.totalPointsLabel")}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.acceptedSubmissions}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {t("profile.acceptedSubmissionsLabel")}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-purple-500/10 rounded-full">
                        <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {successRate}%
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {t("profile.successRateLabel")}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-orange-500/10 rounded-full">
                        <Code2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.totalChallengesCompleted}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {t("profile.completedChallengesLabel")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {t("profile.detailedStats")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.challengesAttempted")}</span>
                        <span className="font-medium">{stats.totalChallengesAttempted}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.totalSubmissions")}</span>
                        <span className="font-medium">{stats.totalSubmissions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.averageScore")}</span>
                        <span className="font-medium">{stats.averageScore}/100</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.globalPosition")}</span>
                        <span className="font-medium">#{stats.rank}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.totalUsers")}</span>
                        <span className="font-medium">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.successRateLabel")}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${Math.min(successRate, 100)}%` }}
                            />
                          </div>
                          <span className="font-medium text-sm">{successRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {t("profile.activity.title")}
                  </CardTitle>
                  <CardDescription>{t("profile.activity.recent")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[520px] max-h-[520px] overflow-y-auto custom-scrollbar space-y-2">
                    {recentActivity && recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <ActivityItem 
                          key={activity.id} 
                          activity={activity} 
                          t={t} 
                        />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-2">{t("profile.activity.noActivity")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("profile.startParticipating")}
                        </p>
                        <Link href="/challenges" className="mt-4 inline-block">
                          <Button size="sm">
                            <Code2 className="h-4 w-4 mr-2" />
                            {t("profile.exploreChallenge")}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t("profile.editProfile")}</span>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("profile.name")}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setValue('name', e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t("profile.email")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setValue('email', e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving || hasErrors}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t("common.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary)/0.8);
        }
      `}</style>
    </div>
  )
}
