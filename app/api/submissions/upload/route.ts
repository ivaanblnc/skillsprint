import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// POST - Upload file to Supabase Storage for submission
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
    
    // For now, we'll get user from the form data since service role doesn't have user context
    // In a real app, you'd verify the user's session token separately

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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'text/javascript',
      'text/x-python',
      'text/x-java-source',
      'text/x-c++src',
      'application/pdf',
      'image/jpeg',
      'image/png'
    ]

    const allowedExtensions = ['.zip', '.txt', '.js', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.pdf', '.jpg', '.jpeg', '.png', '.md']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: "File type not allowed. Allowed types: ZIP, TXT, JS, PY, JAVA, CPP, C, H, HPP, PDF, JPG, PNG, MD" 
      }, { status: 400 })
    }

    // Generate unique filename - Fixed path to avoid duplicate "submissions"
    const fileId = uuidv4()
    const originalName = file.name
    const fileName = `${fileId}_${originalName}`
    const filePath = `${challengeId}/${userId}/${fileName}` // Remove "submissions/" prefix since it's the bucket name

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

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      fileName: originalName,
      fileSize: file.size,
      filePath: filePath
    })

  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
