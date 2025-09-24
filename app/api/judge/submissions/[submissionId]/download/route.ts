import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a judge
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'JUDGE') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the submission
    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        challenge: {
          select: {
            title: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if this submission has a file
    if (!submission.code || !submission.code.startsWith('FILE_UPLOAD:')) {
      return NextResponse.json({ error: 'No file associated with this submission' }, { status: 400 })
    }

    // Extract file information from the code field
    const fileInfo = submission.code.replace('FILE_UPLOAD:', '')
    
    // For now, we'll return the file content as text
    // In a real implementation, you might store files in a cloud storage service
    const fileName = `${submission.user.name || 'user'}_${submission.challenge.title}_${submission.id}.txt`
    const fileContent = fileInfo || 'No file content available'

    // Return the file as a download
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error) {
    console.error('Error downloading submission file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
