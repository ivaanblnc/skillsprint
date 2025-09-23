import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, Trophy, Users, Clock, Zap, Target, ArrowRight } from "lucide-react"

export default function HomePage() {
  const features = [
    {
      icon: Code2,
      title: "Micro-Hackathons",
      description: "Short, focused coding challenges that fit into your schedule",
    },
    {
      icon: Trophy,
      title: "Competitive Leaderboards",
      description: "Compete with developers worldwide and track your progress",
    },
    {
      icon: Clock,
      title: "Time-Boxed Challenges",
      description: "Efficient learning with challenges designed for quick completion",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join a community of passionate developers and creators",
    },
  ]

  const stats = [
    { label: "Active Challenges", value: "50+" },
    { label: "Developers", value: "10K+" },
    { label: "Solutions Submitted", value: "25K+" },
    { label: "Average Completion", value: "30min" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <Code2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SkillSprint</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            New Platform Launch
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            Master Coding Through
            <span className="text-primary"> Micro-Hackathons</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Join thousands of developers in quick, competitive coding challenges. Improve your skills, climb the
            leaderboards, and connect with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8">
                Start Coding Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/challenges">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Browse Challenges
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Why Choose SkillSprint?</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Our platform is designed for developers who want to improve their skills through practical, time-efficient
              challenges.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-pretty">{feature.description}</CardDescription>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">How It Works</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Get started in minutes and begin your coding journey
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Choose a Challenge</h3>
              <p className="text-muted-foreground text-pretty">
                Browse our collection of coding challenges across different difficulty levels and topics.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Code Your Solution</h3>
              <p className="text-muted-foreground text-pretty">
                Use our built-in code editor to write and test your solution within the time limit.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Climb the Leaderboard</h3>
              <p className="text-muted-foreground text-pretty">
                Submit your solution and see how you rank against other developers worldwide.
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
              <CardTitle className="text-3xl mb-4 text-balance">Ready to Sprint?</CardTitle>
              <CardDescription className="text-lg text-pretty">
                Join thousands of developers already improving their skills through micro-hackathons.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="text-lg px-8">
                    <Target className="mr-2 h-5 w-5" />
                    Start Your Journey
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                    <Trophy className="mr-2 h-5 w-5" />
                    View Leaderboard
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
                Challenges
              </Link>
              <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">
                Leaderboard
              </Link>
              <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 SkillSprint. Built for developers, by developers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
