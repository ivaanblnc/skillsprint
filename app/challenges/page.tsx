import { prisma } from "@/lib/prisma"
import { DashboardNav } from "@/components/dashboard-nav"
import { ChallengesList } from "@/components/challenges-list"

async function getChallenges() {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    return challenges
  } catch (error) {
    console.error("Error fetching challenges:", error)
    return []
  }
}

export default async function ChallengesPage() {
  const challenges = await getChallenges()

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-balance">Coding Challenges</h1>
          <p className="text-muted-foreground text-pretty">
            Test your skills with our collection of programming challenges
          </p>
        </div>

        <ChallengesList initialChallenges={challenges} />
      </main>
    </div>
  )
}
