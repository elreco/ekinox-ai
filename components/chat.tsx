'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useChat } from '@ai-sdk/react'
import { ChatRequestOptions } from 'ai'
import { Message } from 'ai/react'
import { toast } from 'sonner'

import { CHAT_ID } from '@/lib/constants'
import { type SuggestionItem } from '@/lib/services/suggestions-service'
import { Model } from '@/lib/types/models'
import { cn, convertToExtendedCoreMessages } from '@/lib/utils'

import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'

// Define section structure
interface ChatSection {
  id: string // User message ID
  userMessage: Message
  assistantMessages: Message[]
}

export function Chat({
  id,
  savedMessages = [],
  query,
  models,
  suggestions,
  isSharePage = false
}: {
  id: string
  savedMessages?: Message[]
  query?: string
  models?: Model[]
  suggestions?: SuggestionItem[]
  isSharePage?: boolean
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    stop,
    append,
    data,
    setData,
    addToolResult,
    reload
  } = useChat({
    initialMessages: savedMessages,
    id: CHAT_ID,
    body: {
      id
    },
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: true, // Enable attachments
    experimental_throttle: 100
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Convert messages array to sections array
  const sections = useMemo<ChatSection[]>(() => {
    const result: ChatSection[] = []
    let currentSection: ChatSection | null = null

    for (const message of messages) {
      if (message.role === 'user') {
        // Start a new section when a user message is found
        if (currentSection) {
          result.push(currentSection)
        }
        currentSection = {
          id: message.id,
          userMessage: message,
          assistantMessages: []
        }
      } else if (currentSection && message.role === 'assistant') {
        // Add assistant message to the current section
        currentSection.assistantMessages.push(message)
      }
      // Ignore other role types like 'system' for now
    }

    // Add the last section if exists
    if (currentSection) {
      result.push(currentSection)
    }

    return result
  }, [messages])

  // Detect if scroll container is at the bottom
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 50 // threshold in pixels
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        setIsAtBottom(true)
      } else {
        setIsAtBottom(false)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial state

    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to the section when a new user message is sent
  useEffect(() => {
    if (sections.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        // If the last message is from user, find the corresponding section
        const sectionId = lastMessage.id
        requestAnimationFrame(() => {
          const sectionElement = document.getElementById(`section-${sectionId}`)
          sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  }, [sections, messages])

  useEffect(() => {
    setMessages(savedMessages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const handleUpdateAndReloadMessage = async (
    messageId: string,
    newContent: string
  ) => {
    let updatedMessages: Message[] = []

    setMessages(currentMessages => {
      updatedMessages = currentMessages.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
      return updatedMessages
    })

    try {
      const messageIndex = updatedMessages.findIndex(
        msg => msg.id === messageId
      )
      if (messageIndex === -1) return

      const messagesUpToEdited = updatedMessages.slice(0, messageIndex + 1)

      setMessages(messagesUpToEdited)

      // Save the updated messages to database via API
      try {
        const extendedMessages =
          convertToExtendedCoreMessages(messagesUpToEdited)
        const response = await fetch('/api/chats', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            messages: extendedMessages,
            title: messagesUpToEdited[0]?.content || 'Chat'
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to save: ${response.statusText}`)
        }
      } catch (saveError) {
        console.error('Failed to save updated message:', saveError)
        toast.error('Failed to save message changes')
      }

      setData(undefined)

      // Wait a bit for state to update, then reload
      setTimeout(async () => {
        await reload({
          body: {
            chatId: id,
            regenerate: true
          }
        })
      }, 100)
    } catch (error) {
      console.error('Failed to reload after message update:', error)
      toast.error(`Failed to reload conversation: ${(error as Error).message}`)
    }
  }

  const handleReloadFrom = async (
    messageId: string,
    options?: ChatRequestOptions
  ) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      const userMessageIndex = messages
        .slice(0, messageIndex)
        .findLastIndex(m => m.role === 'user')
      if (userMessageIndex !== -1) {
        const trimmedMessages = messages.slice(0, userMessageIndex + 1)
        setMessages(trimmedMessages)
        return await reload(options)
      }
    }
    return await reload(options)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
    handleSubmit(e)
  }

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-1 flex-col',
        messages.length === 0 ? 'items-center justify-center' : ''
      )}
      data-testid="full-chat"
    >
      <ChatMessages
        sections={sections}
        data={data}
        onQuerySelect={onQuerySelect}
        isLoading={isLoading}
        chatId={id}
        addToolResult={addToolResult}
        scrollContainerRef={scrollContainerRef}
        onUpdateMessage={handleUpdateAndReloadMessage}
        reload={handleReloadFrom}
        isSharePage={isSharePage}
      />
      {!isSharePage && (
        <ChatPanel
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={onSubmit}
          isLoading={isLoading}
          messages={messages}
          setMessages={setMessages}
          stop={stop}
          query={query}
          append={append}
          models={models}
          suggestions={suggestions}
          showScrollToBottomButton={!isAtBottom}
          scrollContainerRef={scrollContainerRef}
        />
      )}
    </div>
  )
}
