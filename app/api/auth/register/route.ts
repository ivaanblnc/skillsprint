import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, role } = await req.json()

    // Update user with registration data
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        role: role || "PARTICIPANT",
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to complete registration" }, { status: 500 })
  }
}
