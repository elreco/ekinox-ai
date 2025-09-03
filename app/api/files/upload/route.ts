import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/css',
  'text/javascript',
  'text/html',
  'text/xml',
  'application/json',
  'application/javascript',
  'application/xml',
  'application/yaml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]

export interface ProcessedFile {
  id: string
  name: string
  type: string
  size: number
  content: string // base64 encoded content
  mimeType: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const processedFiles: ProcessedFile[] = []

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
          },
          { status: 400 }
        )
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not supported for ${file.name}` },
          { status: 400 }
        )
      }

      try {
        // Convert file to ArrayBuffer then to base64
        const arrayBuffer = await file.arrayBuffer()
        const base64Content = Buffer.from(arrayBuffer).toString('base64')

        const processedFile: ProcessedFile = {
          id: Math.random().toString(36).substring(2, 15),
          name: file.name,
          type: getFileCategory(file.type),
          size: file.size,
          content: base64Content,
          mimeType: file.type
        }

        processedFiles.push(processedFile)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        return NextResponse.json(
          { error: `Failed to process file ${file.name}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      files: processedFiles,
      count: processedFiles.length
    })
  } catch (error) {
    console.error('Error in file upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getFileCategory(mimeType: string): 'image' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('json') ||
    mimeType.includes('csv')
  ) {
    return 'document'
  }
  return 'other'
}
