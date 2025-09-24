import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the creator of the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      select: { 
        creatorId: true,
        title: true
      }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - Only challenge creator can download submissions' }, { status: 403 })
    }

    // Get the submission
    const submission = await prisma.submission.findUnique({
      where: { 
        id: params.submissionId,
        challengeId: params.id
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // If submission has a file URL, redirect to download from storage
    if (submission.fileUrl) {
      // TODO: Implement file download from your storage solution (S3, Supabase Storage, etc.)
      // For now, we'll return the file URL or create a temporary download
      return NextResponse.json({ 
        downloadUrl: submission.fileUrl,
        filename: `${submission.user.name}_${challenge.title}_submission`
      })
    } 
    
    // If only code submission, create a downloadable file
    if (submission.code) {
      const filename = `${submission.user.name}_${challenge.title}_submission.${getFileExtension(submission.language)}`
      const response = new NextResponse(submission.code, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'text/plain',
        },
      })
      return response
    }

    return NextResponse.json({ error: 'No downloadable content found' }, { status: 404 })

  } catch (error) {
    console.error('Error downloading submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getFileExtension(language: string | null): string {
  switch (language?.toLowerCase()) {
    case 'javascript':
      return 'js'
    case 'typescript':
      return 'ts'
    case 'python':
      return 'py'
    case 'java':
      return 'java'
    case 'cpp':
    case 'c++':
      return 'cpp'
    case 'c':
      return 'c'
    case 'csharp':
    case 'c#':
      return 'cs'
    case 'go':
      return 'go'
    case 'rust':
      return 'rs'
    case 'php':
      return 'php'
    case 'ruby':
      return 'rb'
    case 'swift':
      return 'swift'
    case 'kotlin':
      return 'kt'
    case 'scala':
      return 'scala'
    default:
      return 'txt'
  }
}
