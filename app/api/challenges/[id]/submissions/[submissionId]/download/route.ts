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

    // If submission has a file URL, download from Supabase Storage
    if (submission.fileUrl) {
      try {
        console.log('Original fileUrl:', submission.fileUrl)
        
        // Extract the file path from the URL
        const urlParts = submission.fileUrl.split('/storage/v1/object/public/submissions/')
        if (urlParts.length !== 2) {
          console.error('Invalid file URL format:', submission.fileUrl)
          return NextResponse.json({ error: 'Invalid file URL format' }, { status: 400 })
        }
        
        const filePath = urlParts[1]
        console.log('Extracted file path:', filePath)
        
        // Use Supabase client to download the file with service role
        const { createClient } = await import('@supabase/supabase-js')
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        // Download file using Supabase client
        const { data: fileData, error: downloadError } = await serviceSupabase.storage
          .from('submissions')
          .download(filePath)
        
        if (downloadError) {
          console.error('Supabase download error:', downloadError)
          return NextResponse.json({ 
            error: 'Failed to download file from storage',
            details: downloadError 
          }, { status: 500 })
        }
        
        if (!fileData) {
          console.error('No file data received')
          return NextResponse.json({ error: 'No file data received' }, { status: 404 })
        }
        
        console.log('File downloaded successfully, size:', fileData.size)
        
        // Extract original filename from path
        const pathParts = filePath.split('/')
        const originalFilename = pathParts[pathParts.length - 1] || 'submission.zip'
        const cleanFilename = decodeURIComponent(originalFilename)
        const filename = `${(submission.user.name || 'User').replace(/[^a-zA-Z0-9]/g, '_')}_${challenge.title.replace(/[^a-zA-Z0-9]/g, '_')}_${cleanFilename}`
        
        // Determine content type
        let contentType = fileData.type || 'application/octet-stream'
        const fileExtension = cleanFilename.split('.').pop()?.toLowerCase()
        
        if (fileExtension === 'zip') {
          contentType = 'application/zip'
        } else if (fileExtension === 'pdf') {
          contentType = 'application/pdf'
        } else if (['jpg', 'jpeg'].includes(fileExtension || '')) {
          contentType = 'image/jpeg'
        } else if (fileExtension === 'png') {
          contentType = 'image/png'
        }
        
        console.log('File details:', {
          filename,
          contentType,
          size: fileData.size,
          originalFilename
        })
        
        // Convert Blob to ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer()
        
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Content-Type': contentType,
            'Content-Length': arrayBuffer.byteLength.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
        
      } catch (error) {
        console.error('Error processing file download:', error)
        return NextResponse.json({ error: 'Failed to process file download' }, { status: 500 })
      }
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
