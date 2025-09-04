'use client'

import React, { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import Image from 'next/image'

import { File, FileText, Image as ImageIcon, Pencil } from 'lucide-react'

import { SupabaseStorageService } from '@/lib/supabase/storage'
import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CollapsibleMessage } from './collapsible-message'

// Helper function to get file icon based on content type
const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return ImageIcon
  if (
    contentType.includes('pdf') ||
    contentType.includes('document') ||
    contentType.includes('text')
  )
    return FileText
  return File
}

// Helper function to format file size from data URL or enriched Supabase URL
const getFileSizeFromUrl = (url: string): string => {
  try {
    // First try to parse as enriched Supabase URL
    const { metadata } = SupabaseStorageService.parseEnrichedUrl(url)
    if (metadata?.size) {
      const bytes = metadata.size
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Fallback for base64 data URLs
    if (url.startsWith('data:')) {
      const base64 = url.split(',')[1]
      const bytes = (base64.length * 3) / 4
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return 'Unknown size'
  } catch {
    return 'Unknown size'
  }
}

type UserMessageProps = {
  message: string
  messageId?: string
  onUpdateMessage?: (messageId: string, newContent: string) => Promise<void>
  attachments?: Array<{
    name: string
    contentType: string
    url: string
  }>
}

export const UserMessage: React.FC<UserMessageProps> = ({
  message,
  messageId,
  onUpdateMessage,
  attachments
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  // Simple display: message text and attachments separately (no content mixing)
  const { userText, detectedFiles } = React.useMemo(() => {
    // With the fixed streaming, message should now contain only user text
    // and attachments should be completely separate
    return {
      userText: message,
      detectedFiles: attachments || []
    }
  }, [message, attachments])

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setEditedContent(message) // Use the message content for editing
    setIsEditing(true)
  }

  const handleCancelClick = () => {
    setIsEditing(false)
  }

  const handleSaveClick = async () => {
    if (!onUpdateMessage || !messageId) return

    setIsEditing(false)

    try {
      await onUpdateMessage(messageId, editedContent)
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  return (
    <CollapsibleMessage role="user">
      <div
        className="flex-1 break-words w-full group outline-none relative"
        tabIndex={0}
      >
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <TextareaAutosize
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              autoFocus
              className="resize-none flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              minRows={2}
              maxRows={10}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={handleCancelClick}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveClick}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2">
              {/* Message text */}
              <div>{userText}</div>

              {/* Attachments display */}
              {detectedFiles && detectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {detectedFiles.map((attachment, index) => {
                    // Try to get enriched metadata from Supabase URL
                    const { cleanUrl, metadata } =
                      SupabaseStorageService.parseEnrichedUrl(attachment.url)

                    const displayName = metadata?.name || attachment.name
                    const displayContentType =
                      metadata?.contentType || attachment.contentType

                    const IconComponent = getFileIcon(displayContentType)
                    const isImage = displayContentType.startsWith('image/')

                    return (
                      <div
                        key={index}
                        className="relative flex items-center gap-2 bg-muted/50 rounded-lg p-2 border group hover:bg-muted/80 transition-colors max-w-xs"
                      >
                        <div className="flex-shrink-0">
                          {isImage ? (
                            <div className="relative w-8 h-8 rounded overflow-hidden">
                              <Image
                                src={cleanUrl} // Use clean URL without metadata fragment
                                alt={displayName}
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
                            {displayName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="outline"
                              className="text-xs h-4 px-1.5"
                            >
                              {displayContentType.split('/')[0]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {getFileSizeFromUrl(attachment.url)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div
              className={cn(
                'absolute top-1 right-1 transition-opacity ml-2',
                'opacity-0',
                'group-focus-within:opacity-100',
                'md:opacity-0',
                'md:group-hover:opacity-100'
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-7 w-7"
                onClick={handleEditClick}
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </CollapsibleMessage>
  )
}
