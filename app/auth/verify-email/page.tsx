"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Verifying your email...")
  const [loading, setLoading] = useState(true)
  const [showResendForm, setShowResendForm] = useState(false)
  const [email, setEmail] = useState("")
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const verifyUser = async () => {
      const accessToken = searchParams.get("access_token")
      const code = searchParams.get("code") // Supabase también puede enviar 'code'
      const error = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")
      const expired = searchParams.get("expired")
      
      console.log("Verify email params:", { accessToken, code, error, errorDescription, expired })
      
      // Si hay un código o access token, redirigir al callback para que Supabase maneje la verificación
      if (code || accessToken) {
        console.log("Redirecting to callback with verification data...")
        const callbackUrl = new URL("/auth/callback", window.location.origin)
        
        // Copiar todos los parámetros a la URL del callback
        searchParams.forEach((value, key) => {
          callbackUrl.searchParams.set(key, value)
        })
        
        window.location.href = callbackUrl.toString()
        return
      }
      
      // Si viene marcado como expirado, mostrar formulario de reenvío
      if (expired === "true") {
        setMessage("The verification link has expired. Enter your email to receive a new verification link.")
        setLoading(false)
        setShowResendForm(true)
        return
      }
      
      // Si hay errores específicos, mostrarlos
      if (error === "access_denied" && searchParams.get("error_code") === "otp_expired") {
        setMessage("The email verification link has expired. Enter your email below to receive a new one.")
        setLoading(false)
        setShowResendForm(true)
        return
      }

      if (error || errorDescription) {
        setMessage(`Error: ${errorDescription || error}`)
        setLoading(false)
        return
      }
      
      // Si no hay access_token ni code, mostrar formulario de reenvío
      if (!accessToken && !code) {
        setMessage("No verification token found. Enter your email below to receive a verification link.")
        setLoading(false)
        setShowResendForm(true)
        return
      }

      try {
        // Si tenemos un code de Supabase, usar la API para intercambiarlo
        if (code && !accessToken) {
          console.log("Using code to verify...")
          
          const response = await fetch("/api/auth/verify-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          })

          const result = await response.json()

          if (!response.ok || !result.success) {
            console.error("Verification failed:", result)
            setMessage("Invalid or expired verification link. Enter your email below to receive a new one.")
            setLoading(false)
            setShowResendForm(true)
            return
          }

          console.log("Verification successful:", result)
          
          // La sesión ya se estableció en el servidor, solo necesitamos redirigir
          setMessage("Email verified successfully! Redirecting to dashboard...")
          setLoading(false)
          
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
          
        } else if (accessToken) {
          // Usar el access_token directamente
          const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accessToken }),
          })

          const result = await response.json()

          if (!response.ok || !result.success) {
            setMessage("Invalid or expired link. Enter your email below to receive a new one.")
            setLoading(false)
            setShowResendForm(true)
            return
          }

          setMessage("Email verified successfully! Redirecting...")
          setLoading(false)
          
          // Redirigir al dashboard después de un breve delay
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        }
        
      } catch (err) {
        console.error("Verification error:", err)
        setMessage("Something went wrong. Please try again.")
        setLoading(false)
      }
    }

    verifyUser()
  }, [searchParams, router])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setResending(true)
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage("Verification email sent! Check your inbox and click the link promptly.")
        setShowResendForm(false)
      } else {
        setMessage(result.error || "Failed to send verification email")
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md">
        {loading && <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />}
        <p className="text-lg text-muted-foreground mb-6">{message}</p>
        
        {showResendForm && (
          <div className="space-y-4">
            <form onSubmit={handleResend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter your email"
                  required 
                />
              </div>
              <Button type="submit" disabled={resending} className="w-full">
                {resending ? "Sending..." : "Send Verification Email"}
              </Button>
            </form>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>⚠️ If you already registered before, you may need to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Try logging in instead</li>
                <li>Use password reset if you forgot your password</li>
                <li>Register with a different email address</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
