import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Code2, Trophy, Clock, Target } from "lucide-react"
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

export default async function CreateChallengePage() {
  const { user, authUser } = await checkCreatorAccess()

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
            <h1 className="text-3xl font-bold mb-2">Create New Challenge</h1>
            <p className="text-muted-foreground">Design a coding challenge for participants to solve</p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                Challenge Details
              </CardTitle>
              <CardDescription>
                Provide all the information participants need to understand and solve your challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Challenge Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Two Sum Problem"
                    className="w-full"
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Easy</Badge>
                          <span>Beginner friendly</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">Medium</Badge>
                          <span>Intermediate level</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="HARD">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">Hard</Badge>
                          <span>Advanced challenge</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Points */}
                <div className="space-y-2">
                  <Label htmlFor="points">Points Reward</Label>
                  <Input
                    id="points"
                    type="number"
                    placeholder="100"
                    min="10"
                    max="1000"
                    step="10"
                  />
                </div>

                {/* Time Limit */}
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    placeholder="30"
                    min="5"
                    max="180"
                    step="5"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Problem Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the problem clearly. Include constraints, examples, and expected input/output format..."
                  className="min-h-[200px]"
                />
              </div>

              {/* Test Cases */}
              <div className="space-y-4">
                <Label>Example Test Cases</Label>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Test Case 1</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="input1">Input</Label>
                          <Textarea
                            id="input1"
                            placeholder="[2,7,11,15], target = 9"
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="output1">Expected Output</Label>
                          <Textarea
                            id="output1"
                            placeholder="[0,1]"
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Test Case 2</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="input2">Input</Label>
                          <Textarea
                            id="input2"
                            placeholder="[3,2,4], target = 6"
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="output2">Expected Output</Label>
                          <Textarea
                            id="output2"
                            placeholder="[1,2]"
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button variant="outline" className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Add Another Test Case
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button className="flex-1">
                  <Trophy className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
