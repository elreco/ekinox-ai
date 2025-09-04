import { createClient as createServerClient } from '@supabase/supabase-js'

// Server-side storage service using service role key
export class ServerStorageService {
  private supabase

  constructor() {
    this.supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for full permissions
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  async setupBucket() {
    try {
      console.log('🔍 Setting up storage bucket with service role...')

      // Check if bucket exists
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets()
      
      if (listError) {
        console.error('❌ Error listing buckets:', listError)
        return { success: false, error: listError.message }
      }

      const filesBucket = buckets.find(bucket => bucket.name === 'files')
      
      if (filesBucket) {
        console.log('✅ "files" bucket already exists')
        return { success: true, message: 'Bucket already exists' }
      }

      // Create bucket
      const { data: createData, error: createError } = await this.supabase.storage.createBucket('files', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg',
          'application/pdf', 'text/plain', 'text/markdown',
          'text/javascript', 'application/javascript',
          'text/typescript', 'application/typescript',
          'text/html', 'text/css', 'application/json',
          'application/xml', 'text/xml',
          'application/yaml', 'text/yaml',
          'text/csv'
        ],
        fileSizeLimit: 10 * 1024 * 1024
      })

      if (createError) {
        console.error('❌ Error creating bucket:', createError)
        return { success: false, error: createError.message }
      }

      console.log('✅ "files" bucket created successfully')
      return { success: true, message: 'Bucket created successfully' }

    } catch (error) {
      console.error('❌ Setup error:', error)
      return { success: false, error: String(error) }
    }
  }

  async testUpload() {
    try {
      const testContent = `Test upload at ${new Date().toISOString()}`
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
      const testPath = `test/verification-${Date.now()}.txt`

      const { data, error } = await this.supabase.storage
        .from('files')
        .upload(testPath, testFile)

      if (error) {
        console.error('❌ Test upload failed:', error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('files')
        .getPublicUrl(testPath)

      console.log('✅ Test upload successful:', data.path)
      console.log('🔗 Public URL:', urlData.publicUrl)

      // Clean up
      await this.supabase.storage.from('files').remove([testPath])

      return { 
        success: true, 
        message: 'Upload test successful',
        url: urlData.publicUrl 
      }

    } catch (error) {
      console.error('❌ Test error:', error)
      return { success: false, error: String(error) }
    }
  }
}

export const serverStorageService = new ServerStorageService()