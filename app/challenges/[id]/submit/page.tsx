import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardNav } from "@/components/dashboard-nav"
import { CodeEditor } from "@/components/code-editor"

async function getChallengeForSubmission(id: string, userId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      testCases: {
        where: { isPublic: true },
        select: { input: true, expectedOutput: true },
      },
    },
  })

  if (!challenge) return null

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      challengeId_userId: {
        challengeId: id,
        userId,
      },
    },
  })

  return { challenge, existingSubmission }
}

export default async function SubmitPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const result = await getChallengeForSubmission(params.id, session.user.id)

  if (!result) {
    notFound()
  }

  const { challenge, existingSubmission } = result
  const hasEnded = new Date() > new Date(challenge.endDate)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <CodeEditor
            challenge={challenge}
            existingSubmission={existingSubmission}
            hasEnded={hasEnded}
            userId={session.user.id}
          />
        </div>
      </main>
    </div>
  )
}
