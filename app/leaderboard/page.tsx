import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Medal, Award, TrendingUp, Users, Target, Crown } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { LeaderboardTabs } from "@/components/leaderboard-tabs"

async function getLeaderboardData() {
  // Get top users by points
  const topUsers = await prisma.user.findMany({
    orderBy: { points: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      image: true,
      points: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          submissions: {
            where: { status: "ACCEPTED" },
          },
        },
      },
    },
  })

  // Get recent top performers (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentTopPerformers = await prisma.user.findMany({
    where: {
      submissions: {
        some: {
          submittedAt: { gte: thirtyDaysAgo },
          status: "ACCEPTED",
        },
      },
    },
    orderBy: {
      submissions: {
        _count: "desc",
      },
    },
    take: 20,
    select: {
      id: true,
      name: true,
      image: true,
      points: true,
      role: true,
      _count: {
        select: {
          submissions: {
            where: {
              submittedAt: { gte: thirtyDaysAgo },
              status: "ACCEPTED",
            },
          },
        },
      },
    },
  })

  // Get challenge-specific leaderboards
  const challengeLeaderboards = await prisma.challenge.findMany({
    where: { status: "ACTIVE" },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      difficulty: true,
      points: true,
      submissions: {
        where: { status: "ACCEPTED" },
        orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
        take: 10,
        select: {
          score: true,
          submittedAt: true,
          executionTime: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })

  // Get overall stats
  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.submission.count({ where: { status: "ACCEPTED" } }),
    prisma.challenge.count({ where: { status: "ACTIVE" } }),
    prisma.submission.aggregate({
      _avg: { score: true },
      where: { status: "ACCEPTED" },
    }),
  ])

  return {
    topUsers,
    recentTopPerformers,
    challengeLeaderboards,
    stats: {
      totalUsers: stats[0],
      totalSolutions: stats[1],
      activeChallenges: stats[2],
      averageScore: Math.round(stats[3]._avg.score || 0),
    },
  }
}

export default async function LeaderboardPage() {
  const session = await getServerSession()
  const { topUsers, recentTopPerformers, challengeLeaderboards, stats } = await getLeaderboardData()

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "default"
    if (rank === 2) return "secondary"
    if (rank === 3) return "outline"
    return "ghost"
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-balance">Leaderboard</h1>
          <p className="text-muted-foreground text-pretty">See how you rank against other developers</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalSolutions}</p>
                  <p className="text-xs text-muted-foreground">Solutions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeChallenges}</p>
                  <p className="text-xs text-muted-foreground">Active Challenges</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.averageScore}</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <LeaderboardTabs
          topUsers={topUsers}
          recentTopPerformers={recentTopPerformers}
          challengeLeaderboards={challengeLeaderboards}
          currentUserId={session?.user?.id}
        />
      </main>
    </div>
  )
}
