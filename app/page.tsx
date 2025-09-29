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
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-muted/20"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center glass-card p-8 liquid-border-lg glass-elevated">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-3">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">{t("homepage.features.title")}</h2>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
              {t("homepage.features.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="text-center glass-elevated">
                  <CardHeader>
                    <div className="bg-primary/5 border border-primary/10 liquid-border-lg w-16 h-16 flex items-center justify-center mx-auto mb-6">
                      <Icon className="h-8 w-8 text-primary" />
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
              <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t("homepage.howItWorks.step1.title")}</h3>
              <p className="text-muted-foreground text-pretty">
                {t("homepage.howItWorks.step1.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t("homepage.howItWorks.step2.title")}</h3>
              <p className="text-muted-foreground text-pretty">
                {t("homepage.howItWorks.step2.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
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
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl mb-4 text-balance">{t("homepage.cta.title")}</CardTitle>
              <CardDescription className="text-lg text-pretty">
                {t("homepage.cta.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="text-lg px-8">
                    <Target className="mr-2 h-5 w-5" />
                    {t("homepage.cta.startJourney")}
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                    <Trophy className="mr-2 h-5 w-5" />
                    {t("homepage.cta.viewLeaderboard")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
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
              <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">
                {t("homepage.footer.leaderboard")}
              </Link>
              <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
                {t("homepage.footer.signIn")}
              </Link>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>{t("homepage.footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
