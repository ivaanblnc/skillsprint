import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Debug: User ID:', user.id)

    // Get all submissions for this user
    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            points: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    console.log('Debug: Found submissions:', submissions)

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      submissionsCount: submissions.length,
      submissions: submissions
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
