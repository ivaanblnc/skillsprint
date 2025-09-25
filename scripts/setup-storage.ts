import { createClient } from '@/lib/supabase/server'

// Script to check and create the submissions bucket in Supabase Storage
async function setupSubmissionsBucket() {
  try {
    const supabase = await createClient()

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }

    const submissionsBucketExists = buckets?.some(bucket => bucket.name === 'submissions')

    if (!submissionsBucketExists) {
      console.log('Creating submissions bucket...')
      
      // Create the bucket
      const { data: bucketData, error: createError } = await supabase.storage.createBucket('submissions', {
        public: true, // Make it public so we can generate public URLs
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
        console.error('Error creating bucket:', createError)
        return
      }

      console.log('Submissions bucket created successfully:', bucketData)
    } else {
      console.log('Submissions bucket already exists')
    }

    console.warn('Note: You may need to set up RLS policies for the submissions bucket in Supabase dashboard')
    console.warn('Recommended policies:')
    console.warn('1. Allow INSERT for authenticated users where auth.uid() matches the folder structure')
    console.warn('2. Allow SELECT for authenticated users on files they own or for challenge creators')

  } catch (error) {
    console.error('Error setting up submissions bucket:', error)
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupSubmissionsBucket()
}

export { setupSubmissionsBucket }
