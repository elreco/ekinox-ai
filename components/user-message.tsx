'use client'

import React, { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import Image from 'next/image'

import { File, FileText, Image as ImageIcon, Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CollapsibleMessage } from './collapsible-message'
import { SupabaseStorageService } from '@/lib/supabase/storage'

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

  // Parse the message to separate user text from file content
  const { userText, parsedAttachments } = React.useMemo(() => {
    // If we have proper attachments, use them
    if (attachments && attachments.length > 0) {
      return { userText: message, parsedAttachments: attachments }
    }

    // If no attachments but message contains file content, parse it
    // Look for common file patterns in the message
    const lines = message.split('\n')
    let userText = ''
    const foundFiles: Array<{
      name: string
      contentType: string
      url: string
      content: string
    }> = []

    let currentFile: { name?: string; contentType?: string; content: string[] } | null = null
    let isInFileContent = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Detect CSS file content
      if (line.includes('@tailwind') || line.includes('@layer') || line.includes(':root {')) {
        if (!isInFileContent) {
          // Extract user text before file content
          const beforeFile = lines.slice(0, i).join('\n').trim()
          if (beforeFile && !beforeFile.match(/^[@\-\w\s{}.%:;()]+$/)) {
            userText = beforeFile
          }
          
          isInFileContent = true
          currentFile = {
            name: 'globals.css',
            contentType: 'text/css',
            content: []
          }
        }
      }
      
      if (isInFileContent && currentFile) {
        currentFile.content.push(line)
      }
    }

    if (currentFile) {
      const fileContent = currentFile.content.join('\n')
      const dataUrl = `data:${currentFile.contentType};base64,${btoa(fileContent)}`
      
      foundFiles.push({
        name: currentFile.name!,
        contentType: currentFile.contentType!,
        url: dataUrl,
        content: fileContent // Add content property for reconstruction
      } as any) // Type assertion since we're extending the interface
    }

    // If no files found, return original message
    if (foundFiles.length === 0) {
      return { userText: message, parsedAttachments: [] }
    }

    return { 
      userText: userText || 'Uploaded file',
      parsedAttachments: foundFiles 
    }
  }, [message, attachments])

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setEditedContent(userText) // Use only the user text, not the full message with file content
    setIsEditing(true)
  }

  const handleCancelClick = () => {
    setIsEditing(false)
  }

  const handleSaveClick = async () => {
    if (!onUpdateMessage || !messageId) return

    setIsEditing(false)

    try {
      // If we have parsed attachments, reconstruct the full message
      let fullMessage = editedContent
      
      if (parsedAttachments && parsedAttachments.length > 0) {
        // Add file content back to maintain the original message structure
        parsedAttachments.forEach(attachment => {
          if ((attachment as any).content) {
            fullMessage += '\n' + (attachment as any).content
          }
        })
      }
      
      await onUpdateMessage(messageId, fullMessage)
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
              {parsedAttachments && parsedAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {parsedAttachments.map((attachment, index) => {
                    console.log('🔍 Rendering parsed attachment:', {
                      attachment,
                      url: attachment.url,
                      name: attachment.name,
                      contentType: attachment.contentType
                    })
                    
                    // Try to get enriched metadata from Supabase URL
                    const { cleanUrl, metadata } =
                      SupabaseStorageService.parseEnrichedUrl(attachment.url)
                    
                    console.log('🔍 Parsed URL:', { cleanUrl, metadata })
                    
                    const displayName = metadata?.name || attachment.name
                    const displayContentType =
                      metadata?.contentType || attachment.contentType
                    
                    console.log('🔍 Display info:', { displayName, displayContentType })

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
