"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Crown, Clock, Zap, Target } from "lucide-react"

interface User {
  id: string
  name: string | null
  image: string | null
  points: number
  role: string
  _count?: {
    submissions: number
  }
}

interface ChallengeLeaderboard {
  id: string
  title: string
  difficulty: string
  points: number
  submissions: Array<{
    score: number | null
    submittedAt: Date
    executionTime: number | null
    user: {
      id: string
      name: string | null
      image: string | null
    }
  }>
}

interface LeaderboardTabsProps {
  topUsers: User[]
  recentTopPerformers: User[]
  challengeLeaderboards: ChallengeLeaderboard[]
  currentUserId?: string
}

export function LeaderboardTabs({
  topUsers,
  recentTopPerformers,
  challengeLeaderboards,
  currentUserId,
}: LeaderboardTabsProps) {
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
    <Tabs defaultValue="overall" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overall">Overall</TabsTrigger>
        <TabsTrigger value="recent">Recent</TabsTrigger>
        <TabsTrigger value="challenges">By Challenge</TabsTrigger>
      </TabsList>

      <TabsContent value="overall" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Top Performers
            </CardTitle>
            <CardDescription>Ranked by total points earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUsers.map((user, index) => {
                const rank = index + 1
                const isCurrentUser = user.id === currentUserId

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentUser ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">{getRankIcon(rank)}</div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{user.name || "Anonymous"}</p>
                          {isCurrentUser && <Badge variant="outline">You</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {user.role.toLowerCase()}
                          </Badge>
                          {user._count && <span>{user._count.submissions} solutions</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{user.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recent" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Recent Top Performers
            </CardTitle>
            <CardDescription>Most active developers in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTopPerformers.map((user, index) => {
                const rank = index + 1
                const isCurrentUser = user.id === currentUserId

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentUser ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">{getRankIcon(rank)}</div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{user.name || "Anonymous"}</p>
                          {isCurrentUser && <Badge variant="outline">You</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {user.role.toLowerCase()}
                          </Badge>
                          <span>{user._count.submissions} recent solutions</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{user.points}</p>
                      <p className="text-xs text-muted-foreground">total points</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="challenges" className="space-y-6">
        {challengeLeaderboards.map((challenge) => (
          <Card key={challenge.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-balance">{challenge.title}</CardTitle>
                  <CardDescription>Top performers for this challenge</CardDescription>
                </div>
                <div className="flex items-center gap-2">
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
                    {challenge.points} pts
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {challenge.submissions.length > 0 ? (
                <div className="space-y-3">
                  {challenge.submissions.map((submission, index) => {
                    const rank = index + 1
                    const isCurrentUser = submission.user.id === currentUserId

                    return (
                      <div
                        key={`${submission.user.id}-${submission.submittedAt}`}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCurrentUser ? "bg-primary/5 border-primary/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6">{getRankIcon(rank)}</div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={submission.user.image || ""} alt={submission.user.name || ""} />
                            <AvatarFallback className="text-xs">
                              {submission.user.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{submission.user.name || "Anonymous"}</p>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {submission.executionTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {submission.executionTime}ms
                                </span>
                              )}
                              <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{submission.score || 0}/100</p>
                          <p className="text-xs text-muted-foreground">score</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No submissions yet</p>
                  <p className="text-sm">Be the first to solve this challenge!</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  )
}
