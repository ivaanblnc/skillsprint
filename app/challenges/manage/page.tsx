import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2, Eye, Users, BarChart3, Settings } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"

async function checkCreatorAccess() {
  const supabase = await createServerClient()
  const { data: userData, error } = await supabase.auth.getUser()
  
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  // Verificar que el usuario existe en la base de datos y es CREATOR
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { id: userData.user.id },
    select: { role: true, name: true, email: true }
  })

  if (!user) {
    redirect("/auth/login")
  }

  if (user.role !== "CREATOR") {
    redirect("/dashboard")
  }

  return { user, authUser: userData.user }
}

// Mock data para challenges creados por el usuario
const mockCreatedChallenges = [
  {
    id: "1",
    title: "Two Sum Problem",
    difficulty: "EASY",
    points: 50,
    status: "ACTIVE",
    totalSubmissions: 24,
    acceptedSubmissions: 18,
    avgScore: 85,
    timeLimit: 30,
    createdAt: "2024-01-10T10:00:00Z",
    participants: 15
  },
  {
    id: "2", 
    title: "Binary Search Implementation",
    difficulty: "MEDIUM",
    points: 100,
    status: "ACTIVE",
    totalSubmissions: 16,
    acceptedSubmissions: 11,
    avgScore: 72,
    timeLimit: 45,
    createdAt: "2024-01-12T14:30:00Z",
    participants: 12
  },
  {
    id: "3",
    title: "Fibonacci Sequence",
    difficulty: "EASY",
    points: 30,
    status: "DRAFT",
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    avgScore: 0,
    timeLimit: 20,
    createdAt: "2024-01-15T09:15:00Z",
    participants: 0
  },
  {
    id: "4",
    title: "Graph Traversal Algorithm",
    difficulty: "HARD", 
    points: 200,
    status: "COMPLETED",
    totalSubmissions: 8,
    acceptedSubmissions: 3,
    avgScore: 58,
    timeLimit: 90,
    createdAt: "2024-01-05T16:45:00Z",
    participants: 6
  }
]

function getDifficultyVariant(difficulty: string): "default" | "secondary" | "destructive" {
  switch (difficulty?.toUpperCase()) {
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

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "default"
    case "DRAFT":
      return "secondary"
    case "COMPLETED":
      return "secondary"
    case "CANCELLED":
      return "destructive"
    default:
      return "secondary"
  }
}

export default async function ManageChallengesPage() {
  const { user, authUser } = await checkCreatorAccess()

  const activeChallenges = mockCreatedChallenges.filter(c => c.status === "ACTIVE")
  const draftChallenges = mockCreatedChallenges.filter(c => c.status === "DRAFT")
  const completedChallenges = mockCreatedChallenges.filter(c => c.status === "COMPLETED")
  const totalSubmissions = mockCreatedChallenges.reduce((sum, c) => sum + c.totalSubmissions, 0)
  const totalParticipants = mockCreatedChallenges.reduce((sum, c) => sum + c.participants, 0)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Manage Challenges</h1>
                <p className="text-muted-foreground">Create and manage your coding challenges</p>
              </div>
              <Button asChild>
                <Link href="/challenges/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Challenge
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Challenges</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockCreatedChallenges.length}</div>
                <p className="text-xs text-muted-foreground">Created by you</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Eye className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeChallenges.length}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Across all challenges</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participants</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalParticipants}</div>
                <p className="text-xs text-muted-foreground">Unique participants</p>
              </CardContent>
            </Card>
          </div>

          {/* Draft Challenges */}
          {draftChallenges.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-yellow-500" />
                  Draft Challenges
                </CardTitle>
                <CardDescription>
                  Challenges that are still being worked on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {draftChallenges.map((challenge) => (
                    <Card key={challenge.id} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{challenge.title}</h3>
                              <Badge
                                variant={getDifficultyVariant(challenge.difficulty)}
                                className="text-xs"
                              >
                                {challenge.difficulty}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                DRAFT
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <span>Points: {challenge.points}</span>
                              <span>Time: {challenge.timeLimit} min</span>
                              <span>Created: {new Date(challenge.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button size="sm">
                              Publish
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Challenges */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-500" />
                Active Challenges
              </CardTitle>
              <CardDescription>
                Challenges currently accepting submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeChallenges.map((challenge) => (
                  <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{challenge.title}</h3>
                            <Badge
                              variant={getDifficultyVariant(challenge.difficulty)}
                              className="text-xs"
                            >
                              {challenge.difficulty}
                            </Badge>
                            <Badge
                              variant={getStatusVariant(challenge.status)}
                              className="text-xs"
                            >
                              {challenge.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Points:</span>
                              <p className="font-medium">{challenge.points}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time Limit:</span>
                              <p className="font-medium">{challenge.timeLimit} min</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Participants:</span>
                              <p className="font-medium">{challenge.participants}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avg Score:</span>
                              <p className="font-medium">{challenge.avgScore}%</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Submissions:</span>
                              <p className="font-medium">{challenge.totalSubmissions}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Accepted:</span>
                              <p className="font-medium text-green-600">{challenge.acceptedSubmissions}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
                        </Button>
                        <Button size="sm" variant="outline">
                          <Users className="h-4 w-4 mr-2" />
                          View Submissions
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Completed Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Completed Challenges
              </CardTitle>
              <CardDescription>
                Challenges that have finished running
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedChallenges.map((challenge) => (
                  <Card key={challenge.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{challenge.title}</h3>
                            <Badge
                              variant={getDifficultyVariant(challenge.difficulty)}
                              className="text-xs"
                            >
                              {challenge.difficulty}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              COMPLETED
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <span>Submissions: {challenge.totalSubmissions}</span>
                            <span>Accepted: {challenge.acceptedSubmissions}</span>
                            <span>Participants: {challenge.participants}</span>
                            <span>Avg Score: {challenge.avgScore}%</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
