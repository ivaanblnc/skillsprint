import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Primero intentar hacer login para ver si el usuario ya está verificado
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'dummy_password_to_test'
    })

    // Si el error es de credenciales inválidas pero NO de email no confirmado,
    // significa que el usuario existe y está verificado
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      return NextResponse.json({
        error: "User already exists. Try logging in instead or use password reset if you forgot your password."
      }, { status: 400 })
    }

    // Si el error es de email no confirmado, intentar reenviar
    if (signInError && signInError.message.includes('Email not confirmed')) {
      // El usuario existe pero no está confirmado, necesitamos recrearlo
      return NextResponse.json({
        error: "User exists but not confirmed. Please register again with a different email or contact support."
      }, { status: 400 })
    }

    // Si llegamos aquí, intentar crear el usuario de nuevo
    const { error } = await supabase.auth.signUp({
      email: email,
      password: 'temp_password_123', // Password temporal
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return NextResponse.json({
          error: "User already exists. Try logging in instead."
        }, { status: 400 })
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      message: "Verification email sent successfully" 
    })
  } catch (error) {
    console.error("Error resending confirmation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
