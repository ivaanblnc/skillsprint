import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Test endpoint to upload a file to Supabase Storage
export async function POST(req: NextRequest) {
  try {
    // Use service role client to bypass RLS
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
    const testUserId = "test-user-123"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Generate unique filename
    const fileName = `test_${Date.now()}_${file.name}`
    const filePath = `test-challenge/${testUserId}/${fileName}` // Remove duplicate "submissions"

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    console.log('Uploading to path:', filePath)
    console.log('File buffer size:', fileBuffer.length)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ 
        error: "Failed to upload file to storage", 
        details: uploadError 
      }, { status: 500 })
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(filePath)

    console.log('Public URL:', publicUrl)

    // Test downloading the file immediately
    const testDownload = await fetch(publicUrl)
    console.log('Test download status:', testDownload.status)
    console.log('Test download headers:', Object.fromEntries(testDownload.headers.entries()))

    if (testDownload.ok) {
      const downloadedBuffer = await testDownload.arrayBuffer()
      console.log('Downloaded file size:', downloadedBuffer.byteLength)
      console.log('Original file size:', file.size)
      console.log('Sizes match:', downloadedBuffer.byteLength === file.size)
    }

    return NextResponse.json({
      success: true,
      uploadData,
      publicUrl,
      filePath,
      originalSize: file.size,
      testDownloadStatus: testDownload.status
    })

  } catch (error) {
    console.error("Error in test upload:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error }, 
      { status: 500 }
    )
  }
}
