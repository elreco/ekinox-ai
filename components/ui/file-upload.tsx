'use client'

import { useCallback, useEffect, useState } from 'react'

import { Paperclip } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { Button } from './button'
import { type UploadedFile } from './file-preview'

export type { UploadedFile }

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void
  currentFiles: UploadedFile[]
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  className?: string
  onFileRejection?: () => void
}

const getFileType = (file: File): 'image' | 'document' | 'other' => {
  if (file.type.startsWith('image/')) return 'image'
  if (
    file.type.includes('pdf') ||
    file.type.includes('document') ||
    file.type.includes('text') ||
    file.type.includes('spreadsheet') ||
    file.type.includes('presentation')
  ) {
    return 'document'
  }
  return 'other'
}

export function FileUpload({
  onFilesChange,
  currentFiles,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    'image/*',
    'application/pdf',
    'text/*',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/yaml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
    'audio/*',
    'video/*',
    '.py',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.java',
    '.cpp',
    '.c',
    '.h',
    '.cs',
    '.php',
    '.rb',
    '.go',
    '.rs',
    '.swift',
    '.kt',
    '.scala',
    '.sql',
    '.sh',
    '.bat',
    '.ps1',
    '.dockerfile',
    '.yaml',
    '.yml',
    '.toml',
    '.ini',
    '.cfg',
    '.conf'
  ],
  className,
  onFileRejection
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files first
      if (rejectedFiles.length > 0) {
        const errorMessages = rejectedFiles.map(rejection => {
          const file = rejection.file
          const rejectionErrors = rejection.errors

          if (rejectionErrors.some((e: any) => e.code === 'file-too-large')) {
            return `${file.name}: File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`
          }
          if (
            rejectionErrors.some((e: any) => e.code === 'file-invalid-type')
          ) {
            return `${file.name}: File type ${file.type} not supported`
          }
          return `${file.name}: Invalid file`
        })

        // Show error message for rejected files
        toast.error('Files rejected', {
          description: errorMessages.join('\n')
        })
        onFileRejection?.()
        return
      }

      // Handle accepted files - but validate ALL files strictly
      if (acceptedFiles.length === 0) return

      // Additional validation for files that passed dropzone but might still be problematic
      const validatedFiles: {
        valid: File[]
        invalid: { file: File; reason: string }[]
      } = {
        valid: [],
        invalid: []
      }

      acceptedFiles.forEach(file => {
        // First validate MIME type strictly
        const allowedMimeTypes = [
          // Images (only AI-supported formats)
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          // Documents
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/rtf',
          // Code files
          'text/javascript',
          'application/javascript',
          'text/typescript',
          'application/typescript',
          'text/x-typescript',
          'text/html',
          'text/css',
          'text/scss',
          'text/sass',
          'text/less',
          'application/json',
          'application/xml',
          'text/xml',
          'application/yaml',
          'text/yaml',
          'application/x-yaml',
          'text/x-yaml',
          'application/toml',
          'text/toml',
          // Spreadsheets and presentations
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]

        const extension = file.name.toLowerCase().split('.').pop() || ''

        // Strict extension-based validation (only types that work well with AI)
        const supportedExtensions = [
          // Images
          'jpg',
          'jpeg',
          'png',
          'gif',
          'webp',
          // Documents
          'pdf',
          'txt',
          'md',
          // Code files (including TypeScript like Perplexity)
          'js',
          'ts',
          'tsx',
          'jsx',
          'html',
          'css',
          'json',
          'xml',
          'yaml',
          'yml',
          // Spreadsheets
          'csv'
        ]

        // For better reliability, use extension as primary validation
        if (extension && !supportedExtensions.includes(extension)) {
          validatedFiles.invalid.push({
            file,
            reason: `File type .${extension} not supported by AI. Supported: images, documents, code files`
          })
          return
        }

        // Also check MIME type for known problematic cases
        if (
          file.type &&
          !allowedMimeTypes.includes(file.type) &&
          !file.type.startsWith('text/') &&
          !file.type.startsWith('application/')
        ) {
          validatedFiles.invalid.push({
            file,
            reason: `MIME type ${file.type} not supported by AI.`
          })
          return
        }

        // Check file size again (in case it passed dropzone but is still too large)
        if (file.size > maxSize) {
          validatedFiles.invalid.push({
            file,
            reason: `File too large (${Math.round(file.size / 1024 / 1024)}MB, max ${Math.round(maxSize / 1024 / 1024)}MB)`
          })
          return
        }

        // Check if we're at file limit
        if (currentFiles.length + validatedFiles.valid.length >= maxFiles) {
          validatedFiles.invalid.push({
            file,
            reason: `Maximum files reached (${maxFiles})`
          })
          return
        }

        // Additional check for potentially problematic file types
        const problematicExtensions = [
          'exe',
          'bat',
          'cmd',
          'scr',
          'com',
          'pif',
          'vbs',
          'jar'
        ]

        if (problematicExtensions.includes(extension)) {
          validatedFiles.invalid.push({
            file,
            reason: `File type .${extension} not supported for security reasons`
          })
          return
        }

        validatedFiles.valid.push(file)
      })

      // Show errors for invalid files
      if (validatedFiles.invalid.length > 0) {
        const errorMessages = validatedFiles.invalid.map(
          ({ file, reason }) => `${file.name}: ${reason}`
        )
        toast.error('Files rejected', {
          description: errorMessages.join('\n')
        })
        onFileRejection?.()
      }

      // Process valid files
      if (validatedFiles.valid.length === 0) return

      const newFiles: UploadedFile[] = validatedFiles.valid.map(file => {
        const type = getFileType(file)
        const uploadedFile: UploadedFile = {
          file,
          id: Math.random().toString(36).substring(2, 15),
          type
        }

        // Create preview for images
        if (type === 'image') {
          uploadedFile.preview = URL.createObjectURL(file)
        }

        return uploadedFile
      })

      const updatedFiles = [...currentFiles, ...newFiles]
      onFilesChange(updatedFiles)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentFiles, maxFiles, onFilesChange, maxSize]
  )

  // Global drag and drop handlers
  useEffect(() => {
    const handleGlobalDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setDragCounter(prev => prev + 1)
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setDragActive(true)
      }
    }

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setDragCounter(prev => {
        const newCounter = prev - 1
        if (newCounter <= 0) {
          setDragActive(false)
          return 0
        }
        return newCounter
      })
    }

    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setDragActive(false)
      setDragCounter(0)

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files)
        onDrop(files, [])
      }
    }

    // Add event listeners
    document.addEventListener('dragenter', handleGlobalDragEnter)
    document.addEventListener('dragleave', handleGlobalDragLeave)
    document.addEventListener('dragover', handleGlobalDragOver)
    document.addEventListener('drop', handleGlobalDrop)

    return () => {
      // Cleanup
      document.removeEventListener('dragenter', handleGlobalDragEnter)
      document.removeEventListener('dragleave', handleGlobalDragLeave)
      document.removeEventListener('dragover', handleGlobalDragOver)
      document.removeEventListener('drop', handleGlobalDrop)
    }
  }, [onDrop])

  const handleButtonClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = acceptedTypes.join(',')
    input.onchange = e => {
      const target = e.target as HTMLInputElement
      if (target.files) {
        onDrop(Array.from(target.files), [])
      }
    }
    input.click()
  }

  return (
    <div className={cn('relative', className)}>
      {/* File Upload Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        className={cn(
          'p-2 sm:p-2 h-9 w-9 sm:h-8 sm:w-8',
          currentFiles.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
        disabled={currentFiles.length >= maxFiles}
        title={
          currentFiles.length >= maxFiles
            ? `Maximum files reached (${maxFiles})`
            : `Attach files (${currentFiles.length}/${maxFiles})\nSupported: Images, Documents, Code files\nMax size: ${Math.round(maxSize / 1024 / 1024)}MB`
        }
      >
        <Paperclip className="h-4 w-4 sm:h-4 sm:w-4" />
        <span className="sr-only">Attach files</span>
      </Button>

      {/* Drag and Drop Overlay */}
      {dragActive && (
        <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border-2 border-dashed border-blue-500 max-w-md text-center">
            <Paperclip className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm text-muted-foreground mt-2">
              Up to {maxFiles} files, max {Math.round(maxSize / 1024 / 1024)}MB
              each
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
