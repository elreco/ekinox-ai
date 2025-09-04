'use client'

import { createClient } from './client'

export interface UploadedFileData {
  id: string
  name: string
  path: string
  url: string
  contentType: string
  size: number
  uploadedAt: string
}

export class SupabaseStorageService {
  private supabase = createClient()
  private bucket = 'files'

  async uploadFile(file: File, userId?: string): Promise<UploadedFileData> {
    try {
      // Generate unique filename with timestamp and random string
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomId}.${extension}`

      // Create path with optional user folder
      const filePath = userId ? `${userId}/${fileName}` : `public/${fileName}`

      console.log(
        '🔍 Uploading file to Supabase:',
        file.name,
        'Path:',
        filePath
      )

      // Upload file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (error) {
        console.error('❌ Supabase upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      console.log('✅ File uploaded successfully:', urlData.publicUrl)

      // Create enriched URL with metadata for compatibility
      const enrichedUrl = this.createEnrichedUrl(urlData.publicUrl, {
        name: file.name,
        contentType: file.type,
        size: file.size,
        isSupabaseFile: true
      })

      return {
        id: randomId,
        name: file.name,
        path: filePath,
        url: enrichedUrl, // Use enriched URL with metadata
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Storage service error:', error)
      throw error
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([path])

      if (error) {
        console.error('❌ Delete error:', error)
        throw new Error(`Delete failed: ${error.message}`)
      }

      console.log('✅ File deleted successfully:', path)
    } catch (error) {
      console.error('❌ Storage delete error:', error)
      throw error
    }
  }

  async getFileUrl(path: string): Promise<string> {
    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path)

    if (!data?.publicUrl) {
      throw new Error('Failed to get file URL')
    }

    return data.publicUrl
  }

  /**
   * Create an enriched URL that includes metadata as URL fragments
   * This allows us to preserve file metadata even after page refresh
   */
  private createEnrichedUrl(
    originalUrl: string,
    metadata: {
      name: string
      contentType: string
      size: number
      isSupabaseFile: boolean
    }
  ): string {
    const metadataString = JSON.stringify(metadata)
    const encodedMetadata = btoa(metadataString) // Base64 encode
    return `${originalUrl}#supabase-meta:${encodedMetadata}`
  }

  /**
   * Parse an enriched URL to extract metadata
   */
  static parseEnrichedUrl(url: string): {
    cleanUrl: string
    metadata?: {
      name: string
      contentType: string
      size: number
      isSupabaseFile: boolean
    }
  } {
    const metadataPrefix = '#supabase-meta:'
    const metadataIndex = url.indexOf(metadataPrefix)

    if (metadataIndex === -1) {
      return { cleanUrl: url }
    }

    const cleanUrl = url.substring(0, metadataIndex)
    const encodedMetadata = url.substring(metadataIndex + metadataPrefix.length)

    try {
      const metadataString = atob(encodedMetadata)
      const metadata = JSON.parse(metadataString)
      return { cleanUrl, metadata }
    } catch (error) {
      console.error('Failed to parse URL metadata:', error)
      return { cleanUrl: url }
    }
  }
}

// Singleton instance
export const storageService = new SupabaseStorageService()
