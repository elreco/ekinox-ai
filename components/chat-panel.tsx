'use client'

import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useRouter } from 'next/navigation'

import { Message } from 'ai'
import { ArrowUp, ChevronDown, MessageCirclePlus, Square } from 'lucide-react'
import { toast } from 'sonner'

import { type SuggestionItem } from '@/lib/services/suggestions-service'
import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'

import { useArtifact } from './artifact/artifact-context'
import { Button } from './ui/button'
import { FilePreview } from './ui/file-preview'
import { FileUpload, type UploadedFile } from './ui/file-upload'
import { IconLogo } from './ui/icons'
import { EmptyScreen } from './empty-screen'
import { ModelSelector } from './model-selector'
import { SearchModeToggle } from './search-mode-toggle'

interface ChatPanelProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  models?: Model[]
  suggestions?: SuggestionItem[]
  /** Whether to show the scroll to bottom button */
  showScrollToBottomButton: boolean
  /** Reference to the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>
}

export function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append,
  models,
  suggestions,
  showScrollToBottomButton,
  scrollContainerRef
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([])
  const [hasRejectedFiles, setHasRejectedFiles] = useState(false)

  const handleRemoveFile = (id: string) => {
    const updatedFiles = attachedFiles.filter(f => {
      if (f.id === id && f.preview) {
        URL.revokeObjectURL(f.preview)
      }
      return f.id !== id
    })
    setAttachedFiles(updatedFiles)
  }
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const { close: closeArtifact } = useArtifact()

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Don't submit if both input and files are empty
    if (input.trim().length === 0 && attachedFiles.length === 0) {
      return
    }

    // If user tried to upload files but they were all rejected, don't allow submission
    if (
      hasRejectedFiles &&
      attachedFiles.length === 0 &&
      input.trim().length === 0
    ) {
      toast.error('No valid content to send', {
        description: 'Please add valid files or enter text before sending.'
      })
      return
    }

    // If there are attached files, convert them to attachments format
    if (attachedFiles.length > 0) {
      try {
        const attachments = await Promise.all(
          attachedFiles.map(async uploadedFile => {
            // Convert File to base64 data URL
            return new Promise(resolve => {
              const reader = new FileReader()
              reader.onload = () => {
                resolve({
                  name: uploadedFile.file.name,
                  contentType: uploadedFile.file.type,
                  url: reader.result as string
                })
              }
              reader.readAsDataURL(uploadedFile.file)
            })
          })
        )

        // Clear attached files and input
        setAttachedFiles([])

        // Send message with attachments using Vercel AI SDK
        append({
          role: 'user',
          content: input,
          experimental_attachments: attachments
        })

        // Clear input
        const clearEvent = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLTextAreaElement>
        handleInputChange(clearEvent)
      } catch (error) {
        console.error('File attachment error:', error)

        // Better error handling with toast or inline message
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred'

        // Clear files and reset UI on error
        setAttachedFiles([])
        setHasRejectedFiles(true)

        // Reset to home screen
        setTimeout(() => {
          const clearEvent = {
            target: { value: '' }
          } as React.ChangeEvent<HTMLTextAreaElement>
          handleInputChange(clearEvent)
          setShowEmptyScreen(false)
          if (inputRef.current) {
            inputRef.current.blur()
          }
        }, 100)

        // Show a proper error notification
        toast.error('File upload failed', {
          description: errorMessage
        })

        // Don't proceed with submission
        return
      }
    } else {
      // No files, proceed with normal submission
      handleSubmit(e)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    closeArtifact()
    router.push('/')
  }

  const isToolInvocationInProgress = () => {
    if (!messages.length) return false

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant' || !lastMessage.parts) return false

    const parts = lastMessage.parts
    const lastPart = parts[parts.length - 1]

    return (
      lastPart?.type === 'tool-invocation' &&
      lastPart?.toolInvocation?.state === 'call'
    )
  }

  // if query is not empty, submit the query
  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({
        role: 'user',
        content: query
      })
      isFirstRender.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Scroll to the bottom of the container
  const handleScrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div
      className={cn(
        'w-full bg-background group/form-container shrink-0',
        messages.length > 0 ? 'sticky bottom-0 px-2 pb-4' : 'px-6'
      )}
    >
      {messages.length === 0 && (
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="relative flex justify-center items-center space-x-2">
            <IconLogo className="size-12 text-primary-foreground" />
          </div>
        </div>
      )}
      <form
        onSubmit={handleFormSubmit}
        className={cn('max-w-3xl w-full mx-auto relative')}
      >
        {/* Scroll to bottom button - only shown when showScrollToBottomButton is true */}
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -top-10 right-4 z-20 size-8 rounded-full shadow-md"
            onClick={handleScrollToBottom}
            title="Scroll to bottom"
          >
            <ChevronDown size={16} />
          </Button>
        )}

        <div className="relative flex flex-col w-full gap-2 rounded-3xl bg-muted border border-foreground/10">
          {/* File Preview */}
          {attachedFiles.length > 0 && (
            <div className="border-b border-border/50">
              <FilePreview
                files={attachedFiles}
                onRemoveFile={handleRemoveFile}
              />
            </div>
          )}

          <Textarea
            ref={inputRef}
            name="input"
            rows={2}
            maxRows={5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Ask any question"
            spellCheck={false}
            value={input}
            disabled={isLoading || isToolInvocationInProgress()}
            className="resize-none w-full min-h-12 bg-transparent border-0 p-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => {
              handleInputChange(e)
              setShowEmptyScreen(e.target.value.length === 0)
              // Reset rejection state when user types
              if (e.target.value.trim().length > 0) {
                setHasRejectedFiles(false)
              }
            }}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (input.trim().length === 0) {
                  e.preventDefault()
                  return
                }
                e.preventDefault()
                const textarea = e.target as HTMLTextAreaElement
                textarea.form?.requestSubmit()
              }
            }}
            onFocus={() => setShowEmptyScreen(true)}
            onBlur={() => setShowEmptyScreen(false)}
          />

          {/* Bottom menu area */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <FileUpload
                onFilesChange={files => {
                  setAttachedFiles(files)
                  // Reset rejection state when valid files are added
                  if (files.length > 0) {
                    setHasRejectedFiles(false)
                  }
                }}
                currentFiles={attachedFiles}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
                onFileRejection={() => {
                  setHasRejectedFiles(true)

                  // IMMEDIATELY clear files to prevent them from showing
                  setAttachedFiles([])

                  // Use setTimeout to ensure this happens after the alert
                  setTimeout(() => {
                    // Complete reset to initial state
                    const clearEvent = {
                      target: { value: '' }
                    } as React.ChangeEvent<HTMLTextAreaElement>
                    handleInputChange(clearEvent)

                    // Force complete UI reset
                    setShowEmptyScreen(false)
                    setAttachedFiles([]) // Double-clear to be sure

                    // Blur the input
                    if (inputRef.current) {
                      inputRef.current.blur()
                    }
                  }, 100)
                }}
              />
              <ModelSelector models={models || []} />
              <SearchModeToggle />
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNewChat}
                  className="shrink-0 rounded-full group"
                  type="button"
                  disabled={isLoading || isToolInvocationInProgress()}
                >
                  <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-all" />
                </Button>
              )}
              <Button
                type={isLoading ? 'button' : 'submit'}
                size={'icon'}
                variant={'outline'}
                className={cn(isLoading && 'animate-pulse', 'rounded-full')}
                disabled={
                  (input.length === 0 && !isLoading) ||
                  isToolInvocationInProgress()
                }
                onClick={isLoading ? stop : undefined}
              >
                {isLoading ? <Square size={20} /> : <ArrowUp size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <EmptyScreen
            submitMessage={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            suggestions={suggestions}
            className={cn(
              showEmptyScreen
                ? 'opacity-100 transition-all duration-300'
                : 'opacity-0 transition-all duration-300'
            )}
          />
        )}
      </form>
    </div>
  )
}
