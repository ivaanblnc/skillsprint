import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

// POST - Upload file to Supabase Storage and create submission
export async function POST(req: NextRequest) {
  try {
    // Use service role client to bypass RLS temporarily
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    const challengeId = formData.get('challengeId') as string
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    if (challenge.status !== "ACTIVE" || new Date() > challenge.endDate) {
      return NextResponse.json({ error: "Challenge is not active" }, { status: 400 })
    }

    // Check if user already has a final submission
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      }
    })

    if (existingSubmission && !(existingSubmission as any).isDraft) {
      return NextResponse.json(
        { error: "You have already submitted a solution for this challenge" }, 
        { status: 409 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Validate file type
    const allowedExtensions = ['.zip', '.txt', '.js', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.pdf', '.jpg', '.jpeg', '.png', '.md']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: "File type not allowed. Allowed types: ZIP, TXT, JS, PY, JAVA, CPP, C, H, HPP, PDF, JPG, PNG, MD" 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileId = uuidv4()
    const originalName = file.name
    const fileName = `${fileId}_${originalName}`
    const filePath = `${challengeId}/${userId}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(filePath)

    // Create or update submission in database
    let submission
    if (existingSubmission) {
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          fileUrl: publicUrl,
          status: "PENDING",
          isDraft: false,
          submittedAt: new Date()
        } as any
      })
    } else {
      submission = await prisma.submission.create({
        data: {
          challengeId,
          userId,
          fileUrl: publicUrl,
          status: "PENDING",
          isDraft: false
        } as any
      })
    }

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      fileName: originalName,
      fileSize: file.size,
      submission: submission,
      message: "File submitted successfully and is pending review"
    })

  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
