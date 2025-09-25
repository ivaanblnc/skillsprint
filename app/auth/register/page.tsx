"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Code2, Users, Trophy, Scale } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "@/lib/i18n"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("PARTICIPANT")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations()

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    // Validación de email en el frontend
    if (!validateEmail(email)) {
      setMessage(t("auth.validationErrors.validEmail"))
      setIsLoading(false)
      return
    }

    // Validación de contraseña
    if (password.length < 6) {
      setMessage(t("auth.validationErrors.passwordLength"))
      setIsLoading(false)
      return
    }

    try {
      console.log("Attempting sign up with:")
      console.log("- Email:", email)
      console.log("- Email valid:", validateEmail(email))
      console.log("- Name:", name)
      console.log("- Role:", role)
      console.log("- Password length:", password.length)
      console.log("- Redirect URL:", `${window.location.origin}/auth/callback`)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), // Normalizar email
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { name: name.trim(), role },
        },
      })

      console.log("Sign up response:")
      console.log("- Data:", data)
      console.log("- Error:", error)
      console.log("- User ID:", data?.user?.id)
      console.log("- User Email:", data?.user?.email)
      console.log("- Email confirmed:", data?.user?.email_confirmed_at)

      if (error) {
        console.error("Sign up error details:")
        console.error("- Message:", error.message)
        console.error("- Status:", error.status)
        console.error("- Error object:", error)
        
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          setMessage(t("auth.signUpErrors.alreadyRegistered"))
        } else if (error.message.includes("invalid") || error.message.includes("Invalid")) {
          setMessage(`${t("auth.signUpErrors.invalidEmail")}: ${error.message}`)
        } else if (error.message.includes("rate limit") || error.message.includes("Rate limit")) {
          setMessage(t("auth.signUpErrors.rateLimit"))
        } else {
          setMessage(`${t("auth.signUpErrors.registrationFailed")}: ${error.message}`)
        }
      } else {
        console.log("User created successfully:", data.user)
        
        // Si el usuario se creó exitosamente pero sin confirmación de email
        if (data.user && !data.user.email_confirmed_at) {
          console.log("User created but email not confirmed - this is expected")
          setMessage(t("auth.signUpSuccess.emailNotConfirmed"))
        } else {
          setMessage(t("auth.signUpSuccess.confirmed"))
        }
      }
    } catch (err) {
      console.error("Sign up error:", err)
      setMessage(t("auth.signUpErrors.somethingWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  const roleOptions = [
    { value: "PARTICIPANT", label: t("auth.participant"), description: t("auth.roleDescriptions.participantDesc"), icon: Users },
    { value: "CREATOR", label: t("auth.creator"), description: t("auth.roleDescriptions.creatorDesc"), icon: Trophy },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Code2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-balance">{t("auth.joinSkillSprint")}</h1>
          <p className="text-muted-foreground mt-2 text-pretty">{t("auth.createAccountStart")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.signUpTitle")}</CardTitle>
            <CardDescription>{t("auth.createAccountDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t("auth.role")}</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue placeholder={t("auth.selectRole")} /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                {isLoading ? t("auth.creatingAccount") : t("auth.createAccount")}
              </Button>
            </form>

            {message && <div className={`text-sm text-center p-3 rounded-md ${message === t("auth.signUpSuccess.emailNotConfirmed") || message === t("auth.signUpSuccess.confirmed") ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{message}</div>}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("auth.alreadyHaveAccount")} </span>
              <Link href="/auth/login" className="text-primary hover:underline">{t("auth.signIn")}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
