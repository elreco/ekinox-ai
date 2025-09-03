'use client'

import Image from 'next/image'

import { File, FileText, Image as ImageIcon, X } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Badge } from './badge'
import { Button } from './button'

export interface UploadedFile {
  file: File
  id: string
  preview?: string
  type: 'image' | 'document' | 'other'
}

interface FilePreviewProps {
  files: UploadedFile[]
  onRemoveFile: (id: string) => void
  className?: string
}

const getFileIcon = (type: 'image' | 'document' | 'other') => {
  switch (type) {
    case 'image':
      return ImageIcon
    case 'document':
      return FileText
    default:
      return File
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FilePreview({
  files,
  onRemoveFile,
  className
}: FilePreviewProps) {
  if (files.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2 p-2', className)}>
      {files.map(uploadedFile => {
        const IconComponent = getFileIcon(uploadedFile.type)

        return (
          <div
            key={uploadedFile.id}
            className="relative flex items-center gap-2 bg-muted/50 rounded-lg p-2 pr-8 border group hover:bg-muted/80 transition-colors max-w-xs"
          >
            <div className="flex-shrink-0">
              {uploadedFile.preview ? (
                <div className="relative w-8 h-8 rounded overflow-hidden">
                  <Image
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 flex items-center justify-center bg-muted rounded">
                  <IconComponent className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-foreground">
                {uploadedFile.file.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs h-4 px-1.5">
                  {uploadedFile.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.file.size)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(uploadedFile.id)}
              className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
