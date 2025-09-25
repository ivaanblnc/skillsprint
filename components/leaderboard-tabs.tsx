"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Crown, Clock, Zap, Target } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

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
  const t = useTranslations()
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
    <Tabs defaultValue="overall" className="space-y-8">
      <TabsList className="grid w-full grid-cols-3 glass-card p-2 liquid-border-lg h-14">
        <TabsTrigger value="overall" className="liquid-border text-base font-semibold">{t("leaderboard.tabs.overall")}</TabsTrigger>
        <TabsTrigger value="recent" className="liquid-border text-base font-semibold">{t("leaderboard.tabs.recent")}</TabsTrigger>
        <TabsTrigger value="challenges" className="liquid-border text-base font-semibold">{t("leaderboard.tabs.challenges")}</TabsTrigger>
      </TabsList>

      <TabsContent value="overall" className="space-y-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 glass-card liquid-border">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              {t("leaderboard.sections.topPerformers")}
            </CardTitle>
            <CardDescription className="text-base">{t("leaderboard.sections.topPerformersDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topUsers.map((user, index) => {
                const rank = index + 1
                const isCurrentUser = user.id === currentUserId

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-6 glass-card liquid-border-lg ${
                      isCurrentUser ? "bg-primary/10 border-primary/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center justify-center w-12 h-12 glass-card liquid-border">{getRankIcon(rank)}</div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{user.name || "Anonymous"}</p>
                          {isCurrentUser && <Badge variant="outline" className="liquid-border">You</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Badge variant="secondary" className="liquid-border capitalize">
                            {t(`profile.roles.${user.role.toLowerCase()}`)}
                          </Badge>
                          {user._count && (
                            <span className="font-medium">{user._count.submissions} {t("leaderboard.labels.solutions")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{user.points}</p>
                      <p className="text-sm text-muted-foreground font-medium">points</p>
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
              {t("leaderboard.sections.recentTopPerformers")}
            </CardTitle>
            <CardDescription>{t("leaderboard.sections.recentTopPerformersDesc")}</CardDescription>
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
                            {t(`profile.roles.${user.role.toLowerCase()}`)}
                          </Badge>
                          <span>{user._count?.submissions || 0} {t("leaderboard.labels.recentSolutions")}</span>
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
                  <CardDescription>{t("leaderboard.sections.topPerformersForChallenge")}</CardDescription>
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
                  <p>{t("leaderboard.empty.noSubmissions")}</p>
                  <p className="text-sm">{t("leaderboard.empty.beFirst")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  )
}
