"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Processing authentication...")

  useEffect(() => {
    const handleCallback = async () => {
      // Limpiar cookies corruptas de NextAuth
      document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      
      const accessToken = searchParams.get("access_token")
      const refreshToken = searchParams.get("refresh_token")
      const error = searchParams.get("error")
      const errorCode = searchParams.get("error_code")
      const errorDescription = searchParams.get("error_description")

      console.log("Callback params:", { accessToken, refreshToken, error, errorCode, errorDescription })

      // Si hay un error específico de OTP expired o access denied, mostrar mensaje adecuado
      if (error === "access_denied" && errorCode === "otp_expired") {
        setMessage("The email verification link has expired. Please check below to resend the verification email.")
        setTimeout(() => {
          router.push("/auth/verify-email?expired=true")
        }, 3000)
        return
      }

      // Si hay otros errores, redirectar a verify-email con los parámetros
      if (error || errorDescription) {
        console.log("Supabase auth error, redirecting to verify-email")
        const params = new URLSearchParams()
        if (accessToken) params.set("access_token", accessToken)
        if (refreshToken) params.set("refresh_token", refreshToken)
        if (error) params.set("error", error)
        if (errorDescription) params.set("error_description", errorDescription)
        
        router.push(`/auth/verify-email?${params.toString()}`)
        return
      }

      // Si hay access_token, redirectar a verify-email
      if (accessToken) {
        console.log("Access token found, redirecting to verify-email")
        const params = new URLSearchParams()
        params.set("access_token", accessToken)
        if (refreshToken) params.set("refresh_token", refreshToken)
        
        router.push(`/auth/verify-email?${params.toString()}`)
        return
      }

      // Si no hay nada relevante, ir al login
      console.log("No relevant auth data, redirecting to login")
      router.push("/auth/login")
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
