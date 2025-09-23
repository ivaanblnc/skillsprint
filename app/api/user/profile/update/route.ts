import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Esquema de validación
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email format")
})

export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parsear el body
    const body = await request.json()
    
    // Validar los datos
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      )
    }

    const { name, email } = validationResult.data

    // Verificar si el usuario existe en la base de datos
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: email,
          id: { not: user.id }
        }
      })

      if (emailExists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }
    }

    // Si el email cambió, necesitamos actualizar también en Supabase Auth
    let needsEmailVerification = false
    if (email !== existingUser.email) {
      const { error: updateAuthError } = await supabase.auth.updateUser({
        email: email
      })

      if (updateAuthError) {
        return NextResponse.json(
          { error: "Failed to update email in authentication system" }, 
          { status: 500 }
        )
      }
      needsEmailVerification = true
    }

    // Actualizar en la base de datos usando Prisma
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name,
        email: email
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        image: true
      }
    })

    return NextResponse.json({
      user: updatedUser,
      needsEmailVerification
    })

  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
