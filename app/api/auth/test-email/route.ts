import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Testing email validation for:', email)

    const supabase = await createClient()
    
    // Intentar validar el email sin realmente registrar al usuario
    // usando un password temporal
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: 'temp_password_123456', // Password temporal para la prueba
      options: {
        emailRedirectTo: 'http://localhost:3000/test' // URL de prueba
      },
    })

    console.log('Email test result:', { data, error })

    if (error) {
      return NextResponse.json({ 
        valid: false, 
        error: error.message,
        details: error 
      }, { status: 200 })
    }

    // Si llegamos aquí, el email es válido según Supabase
    // Pero necesitamos limpiar el usuario de prueba si se creó
    if (data.user) {
      console.log('Test user created, should be cleaned up manually')
    }

    return NextResponse.json({ 
      valid: true, 
      message: 'Email format is valid',
      user: data.user ? { id: data.user.id, email: data.user.email } : null
    })

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
