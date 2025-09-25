import { NextRequest, NextResponse } from "next/server"

// Simple test endpoint to proxy download from Supabase
export async function GET(req: NextRequest) {
  try {
    // Test with the file we uploaded
    const testUrl = "https://ifzhrvuwqydivxhfzjrx.supabase.co/storage/v1/object/public/submissions/test-challenge/test-user-123/test_1758751282787_submission-cmfyhpsf10004tx9w9wyrhzaz.zip"
    
    console.log('Fetching from:', testUrl)
    
    const response = await fetch(testUrl)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file', status: response.status }, { status: 500 })
    }
    
    console.log('Original response headers:', Object.fromEntries(response.headers.entries()))
    
    // Return the response as-is
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Disposition': 'attachment; filename="test-download.zip"',
        'Content-Type': response.headers.get('content-type') || 'application/zip',
        'Content-Length': response.headers.get('content-length') || '',
      },
    })
    
  } catch (error) {
    console.error("Error in direct download test:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error }, 
      { status: 500 }
    )
  }
}
