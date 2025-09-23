import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Clock, Users, Code2, Target, Calendar } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { ChallengeFilters } from "@/components/challenge-filters"

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

        {/* Filters */}
        <ChallengeFilters />

        {/* Challenge Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => {
            const timeRemaining = Math.max(
              0,
              Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            )

            return (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 text-balance">{challenge.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
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
                        <Badge variant="outline" className="text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          {challenge.points} pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-pretty line-clamp-3">{challenge.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {challenge.timeLimit} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {challenge._count.submissions} submissions
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {timeRemaining}d left
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">by {challenge.creator?.name || "Anonymous"}</div>
                      </div>
                      <Link href={`/challenges/${challenge.id}`}>
                        <Button size="sm">
                          <Target className="h-3 w-3 mr-1" />
                          Start Challenge
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {challenges.length === 0 && (
          <div className="text-center py-12">
            <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
            <p className="text-muted-foreground mb-4">Check back later for new challenges!</p>
          </div>
        )}
      </main>
    </div>
  )
}
