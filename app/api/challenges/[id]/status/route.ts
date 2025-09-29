import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const challengeId = params.id
    const { status } = await request.json()

    // Validate status
    const validStatuses = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      )
    }

    // Get challenge to verify ownership
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { 
        id: true,
        creatorId: true,
        status: true,
        title: true
      }
    })

    if (!challenge) {
      return NextResponse.json(
        { error: "Desafío no encontrado" },
        { status: 404 }
      )
    }

    // Check if user is the creator
    if (challenge.creatorId !== user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar este desafío" },
        { status: 403 }
      )
    }

    // Update challenge status
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: { 
        status,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedChallenge,
      message: `Estado del desafío actualizado a ${status}`
    })

  } catch (error) {
    console.error("Error updating challenge status:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
