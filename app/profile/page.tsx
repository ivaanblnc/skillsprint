import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Mail, User, Calendar, Target, Code2, ArrowLeft, Edit, Save } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"

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
  totalSubmissions: number
  acceptedSubmissions: number
  averageScore: number
  rank: number
  totalUsers: number
}

async function getUserProfile(userId: string): Promise<{ user: UserProfile; stats: UserStats } | null> {
  try {
    const { prisma } = await import("@/lib/prisma")
    
    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        image: true,
      }
    })

    if (!user) {
      return null
    }

    // Por ahora usar datos mock para las estadísticas hasta que las tablas estén listas
    const stats: UserStats = {
      totalChallengesCompleted: 12,
      totalSubmissions: 28,
      acceptedSubmissions: 19,
      averageScore: 78,
      rank: 15,
      totalUsers: 247
    }

    return { user, stats }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
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

export default async function ProfilePage() {
  try {
    // Verificar autenticación
    const supabase = await createServerClient()
    const { data: userData, error } = await supabase.auth.getUser()
    
    if (error || !userData?.user) {
      redirect("/auth/login")
    }

    // Obtener perfil del usuario
    const profileData = await getUserProfile(userData.user.id)
    
    if (!profileData) {
      redirect("/auth/login")
    }

    const { user, stats } = profileData
    const successRate = stats.totalSubmissions > 0 
      ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100) 
      : 0

    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold mb-2">Profile</h1>
              <p className="text-muted-foreground">Manage your account settings and view your statistics</p>
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
                        Personal Information
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage 
                          src={userData.user.user_metadata?.avatar_url || user.image || ""} 
                          alt={user.name || "User"} 
                        />
                        <AvatarFallback className="text-xl">
                          {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{user.name || "No name set"}</h3>
                        <p className="text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role.toLowerCase()}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {user.points} points
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          value={user.name || ""} 
                          disabled 
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          value={user.email || ""} 
                          disabled 
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input 
                          id="role" 
                          value={user.role} 
                          disabled 
                          className="bg-muted capitalize"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="joined">Member Since</Label>
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
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest submissions and achievements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Mock activity data */}
                      <div className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">Solved "Two Sum Problem"</p>
                            <p className="text-sm text-muted-foreground">Earned 100 points</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">2 days ago</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">Attempted "Binary Search Tree"</p>
                            <p className="text-sm text-muted-foreground">Score: 75/100</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">5 days ago</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">Joined SkillSprint</p>
                            <p className="text-sm text-muted-foreground">Welcome to the community!</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
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
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Points</span>
                        <span className="font-semibold">{user.points}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Challenges Completed</span>
                        <span className="font-semibold">{stats.totalChallengesCompleted}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Submissions</span>
                        <span className="font-semibold">{stats.totalSubmissions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="font-semibold">{successRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Average Score</span>
                        <span className="font-semibold">{stats.averageScore}/100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Global Rank</span>
                        <span className="font-semibold">#{stats.rank} of {stats.totalUsers}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/challenges" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Code2 className="mr-2 h-4 w-4" /> Browse Challenges
                      </Button>
                    </Link>
                    <Link href="/leaderboard" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Trophy className="mr-2 h-4 w-4" /> View Leaderboard
                      </Button>
                    </Link>
                    <Link href="/dashboard" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Target className="mr-2 h-4 w-4" /> Dashboard
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
  } catch (error) {
    console.error("Profile page error:", error)
    redirect("/dashboard")
  }
}
