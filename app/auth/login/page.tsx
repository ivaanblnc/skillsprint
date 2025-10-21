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
import { useTranslations } from "@/lib/i18n"

// Google Icon Component
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSignInMode, setIsSignInMode] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations()

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
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`
 },
    })
    if (error) setMessage(error.message)
    else setMessage(t("auth.checkEmailForLink"))
    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      setMessage("")
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(error.message)
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      setMessage(error instanceof Error ? error.message : "Failed to sign in with Google")
    } finally {
      setIsGoogleLoading(false)
    }
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
          <p className="text-muted-foreground mt-2 text-pretty">{t("auth.signInSubtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.signInTitle")}</CardTitle>
            <CardDescription>{isSignInMode ? t("auth.signInToAccount") : t("auth.getMagicLinkEmail")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={isSignInMode ? handleEmailSignIn : handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {isSignInMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              )}
              <Button type="submit" disabled={isLoading} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                {isLoading ? (isSignInMode ? t("auth.signingIn") : t("auth.sendingLink")) : isSignInMode ? t("auth.signIn") : t("auth.sendMagicLink")}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="ghost" onClick={() => setIsSignInMode(!isSignInMode)} className="text-sm">
                {isSignInMode ? t("auth.useMagicLink") : t("auth.usePassword")}
              </Button>
            </div>

            {/* Google Sign-In Button */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t("auth.orSignInWith") || "Or continue with"}</span>
              </div>
            </div>

            <Button 
              type="button"
              variant="outline"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full"
            >
              <GoogleIcon />
              <span className="ml-2">{isGoogleLoading ? (t("auth.signingIn") || "Signing in...") : "Google"}</span>
            </Button>

            {message && <div className={`text-sm text-center p-3 rounded-md ${message === t("auth.checkEmailForLink") ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{message}</div>}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("auth.dontHaveAccount")} </span>
              <Link href="/auth/register" className="text-primary hover:underline">{t("auth.signUp")}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
