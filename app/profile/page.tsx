"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Mail, User, Calendar, Target, Code2, ArrowLeft, Edit, Save, X, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { useTranslations } from "@/lib/i18n"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  role: string
  points: number
  createdAt: Date
  image?: string | null
}

interface UserStats {
  totalChallengesCompleted: number
  totalChallengesAttempted: number
  totalSubmissions: number
  acceptedSubmissions: number
  averageScore: number
  rank: number
  totalUsers: number
  recentActivity?: Array<{
    id: string
    type: string
    title: string
    description: string
    timeAgo: string
    color: string
  }>
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" {
  switch (role) {
    case "CREATOR":
      return "default"
    case "JUDGE":
      return "destructive"
    case "PARTICIPANT":
    default:
      return "secondary"
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case "CREATOR":
      return <Trophy className="h-4 w-4" />
    case "JUDGE":
      return <Target className="h-4 w-4" />
    case "PARTICIPANT":
    default:
      return <Code2 className="h-4 w-4" />
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const t = useTranslations()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authUser, setAuthUser] = useState<any>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const successRate = stats && stats.totalSubmissions > 0 
    ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) 
    : 0

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          router.push('/auth/login')
          return
        }

        setAuthUser(authUser)

        // Fetch user profile and stats from API
        const [profileResponse, statsResponse] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/stats')
        ])

        if (profileResponse.ok) {
          const userData = await profileResponse.json()
          setUser(userData)
          setEditForm({
            name: userData.name || "",
            email: userData.email || ""
          })
        } else {
          router.push('/auth/login')
          return
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const handleEdit = () => {
    setIsEditing(true)
    setError("")
    setSuccess("")
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({
      name: user?.name || "",
      email: user?.email || ""
    })
    setError("")
    setSuccess("")
  }

  const handleSave = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setError(t("profile.updateError"))
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      setError(t("profile.updateError"))
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch('/api/user/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setIsEditing(false)
        
        if (data.needsEmailVerification) {
          setSuccess(t("profile.updateSuccess"))
        } else {
          setSuccess(t("profile.updateSuccess"))
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000)
      } else {
        setError(data.error || t("profile.updateError"))
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(t("profile.updateError"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("profile.backToDashboard")}
              </Link>
              <h1 className="text-3xl font-bold mb-2">{t("profile.title")}</h1>
              <p className="text-muted-foreground">{t("profile.personalInfo")}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {t("profile.personalInfo")}
                      </CardTitle>
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t("profile.editProfile")}
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                            <X className="h-4 w-4 mr-2" />
                            {t("profile.cancel")}
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {t("profile.saveChanges")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Status Messages */}
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

                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage 
                          src={authUser?.user_metadata?.avatar_url || user.image || ""} 
                          alt={user.name || "User"} 
                        />
                        <AvatarFallback className="text-xl">
                          {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{user.name || t("profile.name")}</h3>
                        <p className="text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {t(`profile.roles.${user.role.toLowerCase()}`)}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {user.points} {t("profile.totalPoints")}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("profile.name")}</Label>
                        <Input 
                          id="name" 
                          value={isEditing ? editForm.name : (user.name || "")}
                          onChange={(e) => isEditing && setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                          placeholder={t("profile.name")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("profile.email")}</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={isEditing ? editForm.email : (user.email || "")}
                          onChange={(e) => isEditing && setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                          placeholder={t("profile.email")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">{t("profile.role")}</Label>
                        <Input 
                          id="role" 
                          value={t(`profile.roles.${user.role.toLowerCase()}`)} 
                          disabled 
                          className="bg-muted capitalize"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="joined">{t("profile.memberSince")}</Label>
                        <Input 
                          id="joined" 
                          value={new Date(user.createdAt).toLocaleDateString()}
                          disabled 
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {t("profile.activity.title")}
                    </CardTitle>
                    <CardDescription>{t("profile.activity.title")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                        stats.recentActivity.map((activity: any, index: number) => (
                          <div key={activity.id || index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                activity.color === 'green' ? 'bg-green-500' :
                                activity.color === 'blue' ? 'bg-blue-500' :
                                activity.color === 'yellow' ? 'bg-yellow-500' :
                                activity.color === 'red' ? 'bg-red-500' :
                                activity.color === 'purple' ? 'bg-purple-500' :
                                'bg-gray-500'
                              }`}></div>
                              <div>
                                <p className="font-medium">{activity.title}</p>
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">{activity.timeAgo}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">{t("profile.activity.noActivity")}</p>
                          <p className="text-sm text-muted-foreground mt-2">{t("profile.activity.noActivity")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                {/* Stats Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      {t("profile.stats.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.totalPoints")}</span>
                        <span className="font-semibold">{user.points}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.stats.challengesAttempted")}</span>
                        <span className="font-semibold">{stats?.totalChallengesAttempted || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.stats.challengesCompleted")}</span>
                        <span className="font-semibold">{stats?.totalChallengesCompleted || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.stats.totalSubmissions")}</span>
                        <span className="font-semibold">{stats?.totalSubmissions || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.stats.successRate")}</span>
                        <span className="font-semibold">{successRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.stats.averageScore")}</span>
                        <span className="font-semibold">{stats?.averageScore || 0}/100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("profile.rank")}</span>
                        <span className="font-semibold">#{stats?.rank || 0} {t("profile.outOf")} {stats?.totalUsers || 0} {t("profile.users")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t("nav.dashboard")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/challenges" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Code2 className="mr-2 h-4 w-4" /> {t("nav.challenges")}
                      </Button>
                    </Link>
                    <Link href="/leaderboard" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Trophy className="mr-2 h-4 w-4" /> {t("nav.leaderboard")}
                      </Button>
                    </Link>
                    <Link href="/dashboard" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Target className="mr-2 h-4 w-4" /> {t("nav.dashboard")}
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
