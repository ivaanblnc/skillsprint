import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Target, Clock, Code2, Users, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"

async function checkJudgeAccess() {
  const supabase = await createServerClient()
  const { data: userData, error } = await supabase.auth.getUser()
  
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  // Verificar que el usuario existe en la base de datos y es JUDGE
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { id: userData.user.id },
    select: { role: true, name: true, email: true }
  })

  if (!user) {
    redirect("/auth/login")
  }

  if (user.role !== "JUDGE") {
    redirect("/dashboard")
  }

  return { user, authUser: userData.user }
}

// Mock data para submissions pendientes de revisar
const mockSubmissions = [
  {
    id: "1",
    challenge: {
      title: "Two Sum Problem",
      difficulty: "EASY",
      points: 50
    },
    user: {
      name: "Juan Pérez",
      email: "juan@example.com",
      avatar: null
    },
    submittedAt: "2024-01-15T10:30:00Z",
    language: "Python",
    status: "PENDING",
    code: `def two_sum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []`,
    executionTime: 45,
    memory: 156
  },
  {
    id: "2",
    challenge: {
      title: "Binary Search Implementation",
      difficulty: "MEDIUM",
      points: 100
    },
    user: {
      name: "María González",
      email: "maria@example.com",
      avatar: null
    },
    submittedAt: "2024-01-15T14:20:00Z",
    language: "JavaScript",
    status: "PENDING",
    code: `function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    executionTime: 23,
    memory: 89
  },
  {
    id: "3",
    challenge: {
      title: "Fibonacci Sequence",
      difficulty: "EASY",
      points: 30
    },
    user: {
      name: "Carlos Ruiz",
      email: "carlos@example.com",
      avatar: null
    },
    submittedAt: "2024-01-15T16:45:00Z",
    language: "Java",
    status: "PENDING",
    code: `public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        System.out.println(fibonacci(10));
    }
}`,
    executionTime: 156,
    memory: 245
  }
]

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACCEPTED":
      return "default"
    case "PENDING":
      return "secondary"
    case "WRONG_ANSWER":
    case "TIME_LIMIT_EXCEEDED":
    case "RUNTIME_ERROR":
    case "COMPILATION_ERROR":
      return "destructive"
    default:
      return "secondary"
  }
}

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

function getStatusIcon(status: string) {
  switch (status) {
    case "ACCEPTED":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "PENDING":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <XCircle className="h-4 w-4 text-red-500" />
  }
}

export default async function JudgeSubmissionsPage() {
  const { user, authUser } = await checkJudgeAccess()

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
            <h1 className="text-3xl font-bold mb-2">Review Submissions</h1>
            <p className="text-muted-foreground">Evaluate and score participant submissions</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockSubmissions.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting your evaluation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground">Great progress!</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78</div>
                <p className="text-xs text-muted-foreground">Out of 100</p>
              </CardContent>
            </Card>
          </div>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                Pending Submissions
              </CardTitle>
              <CardDescription>
                Click on any submission to review the code and provide feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSubmissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{submission.challenge.title}</h3>
                            <Badge
                              variant={getDifficultyVariant(submission.challenge.difficulty)}
                              className="text-xs"
                            >
                              {submission.challenge.difficulty}
                            </Badge>
                            <Badge
                              variant={getStatusVariant(submission.status)}
                              className="text-xs flex items-center gap-1"
                            >
                              {getStatusIcon(submission.status)}
                              {submission.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={submission.user.avatar || ""} />
                                <AvatarFallback className="text-xs">
                                  {submission.user.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{submission.user.name}</span>
                            </div>
                            <span>Language: {submission.language}</span>
                            <span>Points: {submission.challenge.points}</span>
                            <span>Runtime: {submission.executionTime}ms</span>
                            <span>Memory: {submission.memory}KB</span>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Submitted Code</span>
                              <Button variant="outline" size="sm">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                            <pre className="text-xs overflow-x-auto max-h-40 overflow-y-auto">
                              <code>{submission.code}</code>
                            </pre>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button size="sm" variant="outline">
                          <Code2 className="h-4 w-4 mr-2" />
                          Review in Detail
                        </Button>
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
