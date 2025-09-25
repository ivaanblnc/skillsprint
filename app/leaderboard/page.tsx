import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Medal, Award, TrendingUp, Users, Target, Crown } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { LeaderboardTabs } from "@/components/leaderboard-tabs"
import { getMessages } from "@/lib/server-i18n"

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
  const messages = await getMessages()

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

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{messages.leaderboard.title}</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">{messages.leaderboard.description}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 glass-card liquid-border">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground font-medium">{messages.leaderboard.stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 glass-card liquid-border">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{stats.totalSolutions}</p>
                  <p className="text-sm text-muted-foreground font-medium">{messages.leaderboard.stats.solutions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 glass-card liquid-border">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{stats.activeChallenges}</p>
                  <p className="text-sm text-muted-foreground font-medium">{messages.leaderboard.stats.activeChallenges}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 glass-card liquid-border">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{stats.averageScore}</p>
                  <p className="text-sm text-muted-foreground font-medium">{messages.leaderboard.stats.avgScore}</p>
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
