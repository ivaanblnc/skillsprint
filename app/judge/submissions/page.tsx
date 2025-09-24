import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Target, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { SubmissionsList } from "@/components/submissions-list"

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

async function getSubmissions(challengeId?: string) {
  const { prisma } = await import("@/lib/prisma")
  
  // Build where clause
  let whereClause: any = {
    status: 'PENDING'
  }

  if (challengeId) {
    whereClause.challengeId = challengeId
  }

  // Get submissions with related data
  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      challenge: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          points: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  })

  return submissions.map(submission => ({
    id: submission.id,
    challenge: {
      id: submission.challenge.id,
      title: submission.challenge.title,
      difficulty: submission.challenge.difficulty,
      points: submission.challenge.points
    },
    user: {
      id: submission.user.id,
      name: submission.user.name || submission.user.email?.split('@')[0] || 'Unknown',
      email: submission.user.email,
      avatar: null
    },
    submittedAt: submission.submittedAt,
    language: submission.language,
    status: submission.status,
    code: submission.code,
    hasFile: !submission.code || submission.code.startsWith('FILE_UPLOAD:') || submission.code.includes('.'),
    executionTime: submission.executionTime,
    memory: submission.memory
  }))
}



export default async function JudgeSubmissionsPage({
  searchParams
}: {
  searchParams: { challenge?: string }
}) {
  const { user, authUser } = await checkJudgeAccess()
  const submissions = await getSubmissions(searchParams.challenge)

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
                <div className="text-2xl font-bold">{submissions.length}</div>
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
          <SubmissionsList initialSubmissions={submissions} />
        </div>
      </main>
    </div>
  )
}
