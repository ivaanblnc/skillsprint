"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Code2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSignInMode, setIsSignInMode] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else router.push("/dashboard")
    setIsLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/verify-email`
 },
    })
    if (error) setMessage(error.message)
    else setMessage("Check your email for a sign-in link!")
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Code2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-balance">Welcome to SkillSprint</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Sign in to start your coding journey</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>{isSignInMode ? "Enter your credentials" : "Get a magic link via email"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={isSignInMode ? handleEmailSignIn : handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {isSignInMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              )}
              <Button type="submit" disabled={isLoading} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                {isLoading ? (isSignInMode ? "Signing in..." : "Sending...") : isSignInMode ? "Sign In" : "Send Magic Link"}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="ghost" onClick={() => setIsSignInMode(!isSignInMode)} className="text-sm">
                {isSignInMode ? "Use magic link instead" : "Use password instead"}
              </Button>
            </div>

            {message && <div className={`text-sm text-center p-3 rounded-md ${message.includes("Check your email") ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{message}</div>}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/register" className="text-primary hover:underline">Sign up</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
