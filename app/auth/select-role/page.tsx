"use client"

import React, { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Code2, Users, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function SelectRoleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = React.useState<"CREATOR" | "PARTICIPANT">("PARTICIPANT")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleContinue = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError("No authenticated user found. Please sign in again.")
        router.push("/auth/login")
        return
      }

      // Create user in database with selected role
      const response = await fetch("/api/auth/create-oauth-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabaseUserId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          image: user.user_metadata?.avatar_url,
          role: role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user profile")
      }

      const data = await response.json()
      console.log("✅ User created with role:", role, data)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
      console.error("Error creating user:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">¡Bienvenido a SkillSprint!</CardTitle>
            <CardDescription className="text-base">
              Elige tu rol para comenzar tu viaje
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <RadioGroup value={role} onValueChange={(value) => setRole(value as "CREATOR" | "PARTICIPANT")}>
              {/* Participant Option */}
              <div
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  role === "PARTICIPANT"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setRole("PARTICIPANT")}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="PARTICIPANT" id="participant" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="participant" className="text-base font-semibold cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-blue-500" />
                        Participante
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Resuelve desafíos de programación, compite en la tabla de clasificación y mejora tus habilidades.
                    </p>
                  </div>
                </div>
              </div>

              {/* Creator Option */}
              <div
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  role === "CREATOR"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setRole("CREATOR")}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="CREATOR" id="creator" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="creator" className="text-base font-semibold cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Code2 className="h-5 w-5 text-purple-500" />
                        Creador
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Crea desafíos de programación, establece criterios de evaluación y mentorea a otros desarrolladores.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            <div className="space-y-3">
              <Button
                onClick={handleContinue}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Puedes cambiar tu rol más tarde en tu perfil
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/auth/login" className="text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <SelectRoleContent />
    </Suspense>
  )
}
