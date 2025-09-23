import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUG: Testing user creation ===")
    
    const { prisma } = await import("@/lib/prisma")
    
    // Datos de prueba
    const testUserId = "4ad3eab3-cbb2-465d-b7c7-893ae63a8431"
    const testEmail = "ivandelllanoblanco@yahoo.es"
    
    console.log("Testing with user:", { id: testUserId, email: testEmail })
    
    const dbUser = await prisma.user.upsert({
      where: { email: testEmail },
      update: {
        name: "Ivan Test",
        role: "PARTICIPANT",
        updatedAt: new Date(),
      },
      create: {
        id: testUserId,
        email: testEmail,
        name: "Ivan Test",
        role: "PARTICIPANT",
      },
    })
    
    console.log("✅ User created/updated successfully:", dbUser)
    
    return NextResponse.json({ 
      success: true, 
      user: dbUser,
      message: "User created/updated successfully" 
    })
    
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error 
    }, { status: 500 })
  }
}
