import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Test endpoint to check Supabase Storage connection
export async function GET(req: NextRequest) {
  try {
    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ 
        error: "Auth error", 
        details: authError 
      }, { status: 401 })
    }

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      return NextResponse.json({ 
        error: "Error listing buckets", 
        details: listError 
      }, { status: 500 })
    }

    const submissionsBucket = buckets?.find(bucket => bucket.name === 'submissions')

    // Create bucket if it doesn't exist
    if (!submissionsBucket) {
      const { data: createData, error: createError } = await supabase.storage.createBucket('submissions', {
        public: true,
        allowedMimeTypes: [
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
        ],
        fileSizeLimit: 5242880 // 5MB in bytes
      })

      if (createError) {
        return NextResponse.json({ 
          error: "Error creating submissions bucket", 
          details: createError 
        }, { status: 500 })
      }

      return NextResponse.json({
        user: user ? { id: user.id, email: user.email } : null,
        buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
        submissionsBucketExists: false,
        bucketCreated: true,
        createData
      })
    }

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      submissionsBucketExists: !!submissionsBucket,
      submissionsBucket
    })

  } catch (error) {
    console.error("Storage test error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error }, 
      { status: 500 }
    )
  }
}
