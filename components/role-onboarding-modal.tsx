"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Code2, Users, AlertCircle } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

interface RoleOnboardingModalProps {
  onRoleSelected: (role: "CREATOR" | "PARTICIPANT") => void
}

export function RoleOnboardingModal({ onRoleSelected }: RoleOnboardingModalProps) {
  const [role, setRole] = React.useState<"CREATOR" | "PARTICIPANT">("PARTICIPANT")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const t = useTranslations()

  const handleContinue = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/user/update-role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update role")
      }

      const data = await response.json()
      console.log("✅ Role updated:", role, data)
      
      // Call the callback to refresh the dashboard
      onRoleSelected(role)
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
      console.error("Error updating role:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg">
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-2xl border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">¡Bienvenido a SkillSprint!</h1>
            <p className="text-muted-foreground text-lg">
              Elige tu rol para comenzar tu viaje
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 mb-8">
            <RadioGroup value={role} onValueChange={(value) => setRole(value as "CREATOR" | "PARTICIPANT")}>
              {/* Participant Option */}
              <div
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  role === "PARTICIPANT"
                    ? "border-blue-500 bg-blue-500/5"
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setRole("PARTICIPANT")}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="PARTICIPANT" id="participant" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="participant" className="text-base font-semibold cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
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
                    ? "border-purple-500 bg-purple-500/5"
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setRole("CREATOR")}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="CREATOR" id="creator" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="creator" className="text-base font-semibold cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
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
          </div>

          <Button
            onClick={handleContinue}
            disabled={loading}
            className="w-full py-6 text-lg"
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
        </div>
      </div>
    </div>
  )
}
