import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Test endpoint to download a specific file from Supabase Storage
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filePath = searchParams.get('filePath')
    
    if (!filePath) {
      return NextResponse.json({ error: "filePath parameter is required" }, { status: 400 })
    }

    console.log('Testing download for file path:', filePath)

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

    // List files to see what's actually there
    console.log('Listing files in submissions bucket...')
    const { data: fileList, error: listError } = await supabase.storage
      .from('submissions')
      .list('', {
        limit: 100,
        offset: 0
      })

    if (listError) {
      console.error('Error listing files:', listError)
    } else {
      console.log('Files in bucket:', fileList?.map(f => f.name))
    }

    // Try to download the specific file
    console.log('Attempting to download file:', filePath)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('submissions')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      return NextResponse.json({ 
        error: "Failed to download file", 
        details: downloadError,
        filePath,
        availableFiles: fileList?.map(f => f.name)
      }, { status: 500 })
    }

    if (!fileData) {
      return NextResponse.json({ 
        error: "No file data received",
        filePath,
        availableFiles: fileList?.map(f => f.name)
      }, { status: 404 })
    }

    console.log('File downloaded successfully!')
    console.log('File size:', fileData.size)
    console.log('File type:', fileData.type)

    // Test the file integrity
    const arrayBuffer = await fileData.arrayBuffer()
    console.log('ArrayBuffer size:', arrayBuffer.byteLength)

    // Return file info instead of the actual file for testing
    return NextResponse.json({
      success: true,
      filePath,
      fileSize: fileData.size,
      fileType: fileData.type,
      arrayBufferSize: arrayBuffer.byteLength,
      integrityCheck: fileData.size === arrayBuffer.byteLength
    })

  } catch (error) {
    console.error("Test download error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error }, 
      { status: 500 }
    )
  }
}
