import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    
    if (authError || !userData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const submissionId = params.id

    // Get submission details
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        challenge: {
          select: {
            id: true,
            title: true,
            creatorId: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" }, 
        { status: 404 }
      )
    }

    // Check if user has permission to view this submission
    // User can view if they are the creator of the challenge or the submitter
    const canView = submission.challenge.creatorId === userData.user.id || 
                   submission.userId === userData.user.id

    if (!canView) {
      return NextResponse.json(
        { error: "Forbidden" }, 
        { status: 403 }
      )
    }

    // Prepare response with code or file info
    const responseData = {
      id: submission.id,
      status: submission.status,
      score: submission.score,
      submittedAt: submission.submittedAt,
      user: submission.user,
      challenge: {
        title: submission.challenge.title
      }
    }

    // Add code if it exists
    if (submission.code) {
      Object.assign(responseData, {
        code: submission.code,
        language: submission.language
      })
    }

    // Add file info - always check for files, even if there's code
    let fileUrl = null
    let fileName = null
    
    if (submission.fileUrl) {
      // Generate signed URL for file download from Supabase storage
      try {
        const { data: urlData } = await supabase.storage
          .from('submissions')
          .createSignedUrl(submission.fileUrl, 3600) // 1 hour expiry
        
        fileUrl = urlData?.signedUrl || submission.fileUrl
        // Extract filename from URL
        fileName = submission.fileUrl.split('/').pop() || 'submission'
      } catch (error) {
        console.error('Error generating signed URL:', error)
        fileUrl = submission.fileUrl
        fileName = submission.fileUrl.split('/').pop() || 'submission'
      }

      Object.assign(responseData, {
        fileName,
        fileUrl
      })
    } else {
      // Even if no fileUrl in database, check if there's a file in storage with submission ID
      try {
        const possiblePaths = [
          `${submission.userId}/${submission.challengeId}/${submission.id}`,
          `submissions/${submission.id}`,
          `${submission.id}`,
        ]
        
        for (const path of possiblePaths) {
          // Try different common file extensions
          const extensions = ['.zip', '.js', '.py', '.java', '.cpp', '.c', '.txt', '.pdf']
          
          for (const ext of extensions) {
            try {
              const { data, error } = await supabase.storage
                .from('submissions')
                .createSignedUrl(`${path}${ext}`, 60) // Short expiry for checking existence
              
              if (data?.signedUrl && !error) {
                // File exists, create a longer-lived URL
                const { data: longUrlData } = await supabase.storage
                  .from('submissions')
                  .createSignedUrl(`${path}${ext}`, 3600)
                
                fileUrl = longUrlData?.signedUrl
                fileName = `submission${ext}`
                
                Object.assign(responseData, {
                  fileName,
                  fileUrl
                })
                break
              }
            } catch (err) {
              // Continue to next extension
            }
          }
          
          if (fileUrl) break // Stop if we found a file
        }
      } catch (error) {
        console.error('Error checking for files in storage:', error)
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error("Error fetching submission details:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
