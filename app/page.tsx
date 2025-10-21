import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, Trophy, Users, Clock, Zap, Target, ArrowRight } from "lucide-react"
import { getMessages, translate } from "@/lib/server-i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const messages = await getMessages()
  const t = (key: string, params?: Record<string, string>) => translate(messages, key, params)

  // Obtener estadísticas reales desde la base de datos
  const [challengesCount, usersCount, submissionsCount] = await Promise.all([
    prisma.challenge.count({
      where: {
        status: 'ACTIVE'
      }
    }),
    prisma.user.count(),
    prisma.submission.count()
  ])
  
  const features = [
    {
      icon: Code2,
      title: t("homepage.features.microHackathons.title"),
      description: t("homepage.features.microHackathons.description"),
    },
    {
      icon: Trophy,
      title: t("homepage.features.competitiveLeaderboards.title"),
      description: t("homepage.features.competitiveLeaderboards.description"),
    },
    {
      icon: Clock,
      title: t("homepage.features.timeBoxedChallenges.title"),
      description: t("homepage.features.timeBoxedChallenges.description"),
    },
    {
      icon: Users,
      title: t("homepage.features.communityDriven.title"),
      description: t("homepage.features.communityDriven.description"),
    },
  ]

  const stats = [
    { label: t("homepage.stats.activeChallenges"), value: `${challengesCount}+` },
    { label: t("homepage.stats.developers"), value: `${usersCount >= 1000 ? Math.floor(usersCount/1000) + 'K' : usersCount}+` },
    { label: t("homepage.stats.solutionsSubmitted"), value: `${submissionsCount >= 1000 ? Math.floor(submissionsCount/1000) + 'K' : submissionsCount}+` },
  ]

  return (
    <div className="-mt-16 min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary liquid-border p-2.5 glass-elevated">
              <Code2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SkillSprint</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button variant="ghost">{t("homepage.navigation.signIn")}</Button>
            </Link>
            <Link href="/auth/register">
              <Button>{t("homepage.navigation.getStarted")}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20"></div>
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <Badge variant="secondary" className="mb-6 glass-card px-4 py-2 liquid-border glass-elevated">
            <Zap className="h-4 w-4 mr-2" />
            {t("homepage.hero.badge")}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-balance">
            {t("homepage.hero.title1")}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> {t("homepage.hero.title2")}</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 text-pretty max-w-3xl mx-auto leading-relaxed">
            {t("homepage.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-10 h-14 liquid-border-lg glass-elevated">
                {t("homepage.hero.startCoding")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/challenges">
              <Button size="lg" variant="outline" className="text-lg px-10 h-14 liquid-border-lg">
                {t("homepage.hero.browseChallenges")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 relative bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950/50">
        <div className="absolute inset-0 bg-muted/20"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const colors = [
                "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800",
                "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800",
                "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800"
              ]
              const textColors = [
                "text-blue-600 dark:text-blue-400",
                "text-purple-600 dark:text-purple-400",
                "text-green-600 dark:text-green-400"
              ]
              return (
                <div key={index} className={`text-center glass-card p-8 liquid-border-lg glass-elevated bg-gradient-to-br ${colors[index]} border`}>
                  <div className={`text-4xl md:text-5xl font-bold ${textColors[index]} mb-3`}>{stat.value}</div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-950/30 dark:to-transparent">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">{t("homepage.features.title")}</h2>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
              {t("homepage.features.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const cardColors = [
                "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800",
                "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800",
                "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 border-amber-200 dark:border-amber-800",
                "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800"
              ]
              const iconColors = [
                "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
                "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
                "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
                "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400"
              ]
              return (
                <Card key={index} className={`text-center glass-elevated ${cardColors[index]} border`}>
                  <CardHeader>
                    <div className={`${iconColors[index]} border border-current/20 liquid-border-lg w-16 h-16 flex items-center justify-center mx-auto mb-6`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-pretty text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">{t("homepage.howItWorks.title")}</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              {t("homepage.howItWorks.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t("homepage.howItWorks.step1.title")}</h3>
              <p className="text-muted-foreground text-pretty">
                {t("homepage.howItWorks.step1.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t("homepage.howItWorks.step2.title")}</h3>
              <p className="text-muted-foreground text-pretty">
                {t("homepage.howItWorks.step2.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t("homepage.howItWorks.step3.title")}</h3>
              <p className="text-muted-foreground text-pretty">
                {t("homepage.howItWorks.step3.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-3xl mb-4 text-balance text-black dark:text-white">{t("homepage.cta.title")}</CardTitle>
              <CardDescription className="text-lg text-pretty text-gray-700 dark:text-gray-300">
                {t("homepage.cta.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700">
                    <Target className="mr-2 h-5 w-5" />
                    {t("homepage.cta.startJourney")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="bg-primary rounded-lg p-2">
                <Code2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SkillSprint</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/challenges" className="text-muted-foreground hover:text-foreground">
                {t("homepage.footer.challenges")}
              </Link>
              <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
                {t("homepage.footer.signIn")}
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 text-center text-muted-foreground">
            <p>{t("homepage.footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
