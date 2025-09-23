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

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("PARTICIPANT")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const supabase = createClient()

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
      setMessage("Please enter a valid email address.")
      setIsLoading(false)
      return
    }

    // Validación de contraseña
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.")
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
          setMessage("This email is already registered. Try logging in instead or use a different email.")
        } else if (error.message.includes("invalid") || error.message.includes("Invalid")) {
          setMessage(`Invalid email address: ${error.message}. Please use a different email format.`)
        } else if (error.message.includes("rate limit") || error.message.includes("Rate limit")) {
          setMessage("Too many attempts. Please wait a few minutes and try again.")
        } else {
          setMessage(`Registration failed: ${error.message}`)
        }
      } else {
        console.log("User created successfully:", data.user)
        
        // Si el usuario se creó exitosamente pero sin confirmación de email
        if (data.user && !data.user.email_confirmed_at) {
          console.log("User created but email not confirmed - this is expected")
          setMessage("Registration successful! Please check your email and click the verification link to complete your account setup.")
        } else {
          setMessage("Registration successful! You can now log in.")
        }
      }
    } catch (err) {
      console.error("Sign up error:", err)
      setMessage("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const roleOptions = [
    { value: "PARTICIPANT", label: "Participant", description: "Join challenges and compete", icon: Users },
    { value: "CREATOR", label: "Creator", description: "Create and manage challenges", icon: Trophy },
    { value: "JUDGE", label: "Judge", description: "Evaluate and score submissions", icon: Scale },
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
          <h1 className="text-3xl font-bold text-balance">Join SkillSprint</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Create your account and start coding</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create your account to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {message && <div className={`text-sm text-center p-3 rounded-md ${message.includes("Check your email") ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{message}</div>}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-primary hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
