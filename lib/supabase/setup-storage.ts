import { createClient } from './client'

export async function setupStorageBucket() {
  const supabase = createClient()

  try {
    console.log('🔍 Checking if "files" bucket exists...')

    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      throw listError
    }

    const filesBucket = buckets.find(bucket => bucket.name === 'files')

    if (filesBucket) {
      console.log('✅ "files" bucket already exists')
      return true
    }

    console.log('📦 Creating "files" bucket...')

    // Create bucket if it doesn't exist
    const { data: createData, error: createError } =
      await supabase.storage.createBucket('files', {
        public: true, // Make it public so files are accessible via URL
        allowedMimeTypes: [
          // Images
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/jpg',
          // Documents
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          // Code files
          'text/javascript',
          'application/javascript',
          'text/typescript',
          'application/typescript',
          'text/html',
          'text/css',
          'application/json',
          'application/xml',
          'text/xml',
          'application/yaml',
          'text/yaml',
          // Spreadsheets
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv'
        ],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
      })

    if (createError) {
      console.error('❌ Error creating bucket:', createError)
      throw createError
    }

    console.log('✅ "files" bucket created successfully')

    // Set up RLS policy for public read access
    console.log('🔐 Setting up storage policies...')

    return true
  } catch (error) {
    console.error('❌ Setup storage error:', error)
    return false
  }
}

// Test function to verify upload works
export async function testStorageUpload() {
  const supabase = createClient()

  try {
    // Create a simple test file
    const testContent = 'Test file for storage verification'
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })

    const testPath = `test/verification-${Date.now()}.txt`

    console.log('🧪 Testing file upload...')

    const { data, error } = await supabase.storage
      .from('files')
      .upload(testPath, testFile)

    if (error) {
      console.error('❌ Test upload failed:', error)
      return false
    }

    console.log('✅ Test upload successful:', data.path)

    // Clean up test file
    await supabase.storage.from('files').remove([testPath])
    console.log('🧹 Test file cleaned up')

    return true
  } catch (error) {
    console.error('❌ Test upload error:', error)
    return false
  }
}
