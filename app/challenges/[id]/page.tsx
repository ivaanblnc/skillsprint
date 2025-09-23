import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Clock, Users, Calendar, Code2 } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { AuthRequiredTrigger } from "@/components/auth-required-trigger"

// Mock data for challenges until the real data is available
const mockChallenges = {
  "challenge-1": {
    id: "challenge-1",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "EASY",
    points: 100,
    timeLimit: 30,
    status: "ACTIVE",
    createdAt: "2025-09-20T10:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    creator: {
      name: "John Doe",
      avatar: null
    },
    testCases: [
      {
        input: "[2,7,11,15], target = 9",
        expectedOutput: "[0,1]"
      },
      {
        input: "[3,2,4], target = 6", 
        expectedOutput: "[1,2]"
      }
    ],
    submissions: { count: 150 }
  },
  "challenge-2": {
    id: "challenge-2",
    title: "Valid Parentheses",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "EASY",
    points: 120,
    timeLimit: 25,
    status: "ACTIVE",
    createdAt: "2025-09-21T10:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    creator: {
      name: "Jane Smith",
      avatar: null
    },
    testCases: [
      {
        input: "\"()\"",
        expectedOutput: "true"
      },
      {
        input: "\"()[]{}\"",
        expectedOutput: "true"
      },
      {
        input: "\"(]\"",
        expectedOutput: "false"
      }
    ],
    submissions: { count: 89 }
  },
  "challenge-3": {
    id: "challenge-3",
    title: "Merge Two Sorted Lists",
    description: "You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.",
    difficulty: "EASY",
    points: 150,
    timeLimit: 35,
    status: "ACTIVE",
    createdAt: "2025-09-22T10:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    creator: {
      name: "Bob Wilson",
      avatar: null
    },
    testCases: [
      {
        input: "list1 = [1,2,4], list2 = [1,3,4]",
        expectedOutput: "[1,1,2,3,4,4]"
      },
      {
        input: "list1 = [], list2 = []",
        expectedOutput: "[]"
      }
    ],
    submissions: { count: 203 }
  }
} as const

async function getUserIfAuthenticated() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const user = await getUserIfAuthenticated()
  
  // Get challenge from mock data
  const challenge = mockChallenges[params.id as keyof typeof mockChallenges]
  
  if (!challenge) {
    notFound()
  }

  const timeRemaining = Math.max(
    0,
    Math.floor((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  const hasEnded = new Date() > new Date(challenge.endDate)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 text-balance">{challenge.title}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <Badge
                    variant={
                      challenge.difficulty === "EASY"
                        ? "secondary"
                        : challenge.difficulty === "MEDIUM"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {challenge.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    <Trophy className="h-3 w-3 mr-1" />
                    {challenge.points} points
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {!hasEnded && user && (
                  <Link href={`/challenges/${challenge.id}/submit`}>
                    <Button>
                      <Code2 className="h-4 w-4 mr-2" />
                      Start Challenge
                    </Button>
                  </Link>
                )}
                {!hasEnded && !user && (
                  <AuthRequiredTrigger>
                    <Button>
                      <Code2 className="h-4 w-4 mr-2" />
                      Start Challenge
                    </Button>
                  </AuthRequiredTrigger>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {challenge.timeLimit} minutes
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {challenge.submissions.count} submissions
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {hasEnded ? "Ended" : `${timeRemaining} days left`}
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-pretty whitespace-pre-wrap">{challenge.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Test Cases */}
              {challenge.testCases && challenge.testCases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Example Test Cases</CardTitle>
                    <CardDescription>These are sample inputs and expected outputs for your solution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {challenge.testCases.map((testCase, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Input:</h4>
                              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                                <code>{testCase.input}</code>
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Expected Output:</h4>
                              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                                <code>{testCase.expectedOutput}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Challenge Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={hasEnded ? "destructive" : "default"}>{hasEnded ? "Ended" : "Active"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Limit</span>
                    <span className="text-sm font-medium">{challenge.timeLimit} minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Points</span>
                    <span className="text-sm font-medium">{challenge.points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Submissions</span>
                    <span className="text-sm font-medium">{challenge.submissions.count}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={challenge.creator.avatar || ""} />
                      <AvatarFallback>{challenge.creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Created by</p>
                      <p className="text-xs text-muted-foreground">{challenge.creator.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!hasEnded && user && (
                    <Link href={`/challenges/${challenge.id}/submit`} className="block">
                      <Button className="w-full">
                        <Code2 className="h-4 w-4 mr-2" />
                        Start Coding
                      </Button>
                    </Link>
                  )}
                  {!hasEnded && !user && (
                    <AuthRequiredTrigger>
                      <Button className="w-full">
                        <Code2 className="h-4 w-4 mr-2" />
                        Start Coding
                      </Button>
                    </AuthRequiredTrigger>
                  )}
                  <Link href="/challenges" className="block">
                    <Button variant="outline" className="w-full bg-transparent">
                      Back to Challenges
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
