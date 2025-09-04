import {
  convertToCoreMessages,
  CoreMessage,
  CoreToolMessage,
  generateId,
  JSONValue,
  Message,
  ToolInvocation
} from 'ai'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { type Model } from '@/lib/types/models'

import { ExtendedCoreMessage } from '../types'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Takes an array of AIMessage and modifies each message where the role is 'tool'.
 * Changes the role to 'assistant' and converts the content to a JSON string.
 * Returns the modified messages as an array of CoreMessage.
 *
 * @param aiMessages - Array of AIMessage
 * @returns modifiedMessages - Array of modified messages
 */
export function transformToolMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.map(message =>
    message.role === 'tool'
      ? {
          ...message,
          role: 'assistant',
          content: JSON.stringify(message.content),
          type: 'tool'
        }
      : message
  ) as CoreMessage[]
}

/**
 * Sanitizes a URL by replacing spaces with '%20'
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/\s+/g, '%20')
}

export function createModelId(model: Model): string {
  return `${model.providerId}:${model.id}`
}

export function getDefaultModelId(models: Model[]): string {
  if (!models.length) {
    throw new Error('No models available')
  }
  return createModelId(models[0])
}

/**
 * Formats a date to a human-readable "time ago" string
 * @param date - The date to format
 * @returns Formatted time ago string
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

function addToolMessageToChat({
  toolMessage,
  messages
}: {
  toolMessage: CoreToolMessage
  messages: Array<Message>
}): Array<Message> {
  return messages.map(message => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map(toolInvocation => {
          const toolResult = toolMessage.content.find(
            tool => tool.toolCallId === toolInvocation.toolCallId
          )

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result
            }
          }

          return toolInvocation
        })
      }
    }

    return message
  })
}

export function convertToUIMessages(
  messages: Array<ExtendedCoreMessage>
): Array<Message> {
  let pendingAnnotations: JSONValue[] = []
  let pendingReasoning: string | undefined = undefined
  let pendingReasoningTime: number | undefined = undefined

  return messages.reduce((chatMessages: Array<Message>, message) => {
    // Handle tool messages
    if (message.role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages
      })
    }

    // Data messages are used to capture annotations, including reasoning.
    if (message.role === 'data') {
      if (
        message.content !== null &&
        message.content !== undefined &&
        typeof message.content !== 'string'
      ) {
        const content = message.content as JSONValue
        if (
          content &&
          typeof content === 'object' &&
          'type' in content &&
          'data' in content
        ) {
          if (content.type === 'reasoning') {
            // If content.data is an object, capture its reasoning and time;
            // otherwise treat it as a simple string.
            if (typeof content.data === 'object' && content.data !== null) {
              pendingReasoning = (content.data as any).reasoning
              pendingReasoningTime = (content.data as any).time
            } else {
              pendingReasoning = content.data as string
              pendingReasoningTime = 0
            }
          } else {
            pendingAnnotations.push(content)
          }
        }
      }
      return chatMessages
    }

    // Build the text content and tool invocations from message.content.
    let textContent = ''
    let toolInvocations: Array<ToolInvocation> = []

    if (message.content) {
      if (typeof message.content === 'string') {
        textContent = message.content
      } else if (Array.isArray(message.content)) {
        for (const content of message.content) {
          if (content && typeof content === 'object' && 'type' in content) {
            if (content.type === 'text' && 'text' in content) {
              textContent += content.text
            } else if (
              content.type === 'tool-call' &&
              'toolCallId' in content &&
              'toolName' in content &&
              'args' in content
            ) {
              toolInvocations.push({
                state: 'call',
                toolCallId: content.toolCallId,
                toolName: content.toolName,
                args: content.args
              } as ToolInvocation)
            }
          }
        }
      }
    }

    // For assistant messages, assemble annotations from any stashed data.
    let annotations: JSONValue[] | undefined = undefined
    if (message.role === 'assistant') {
      if (pendingAnnotations.length > 0 || pendingReasoning !== undefined) {
        annotations = [
          ...pendingAnnotations,
          ...(pendingReasoning !== undefined
            ? [
                {
                  type: 'reasoning',
                  data: {
                    reasoning: pendingReasoning,
                    time: pendingReasoningTime ?? 0
                  }
                }
              ]
            : [])
        ]
      }
    }

    // Create the new message. Note: we do not include a top-level "reasoning" property.
    const newMessage: Message = {
      id: generateId(),
      role: message.role,
      content: textContent,
      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
      annotations: annotations,
      // Preserve custom properties when converting back to UI messages
      ...((message as any).data && { data: (message as any).data }),
      ...((message as any).fileContents && {
        fileContents: (message as any).fileContents
      }),
      ...((message as any).experimental_attachments && {
        experimental_attachments: (message as any).experimental_attachments
      }),
      ...((message as any).supabaseFiles && {
        supabaseFiles: (message as any).supabaseFiles
      })
    }

    chatMessages.push(newMessage)

    // Clear pending state after processing an assistant message.
    if (message.role === 'assistant') {
      pendingAnnotations = []
      pendingReasoning = undefined
      pendingReasoningTime = undefined
    }

    return chatMessages
  }, [])
}

export function convertToExtendedCoreMessages(
  messages: Message[]
): ExtendedCoreMessage[] {
  const result: ExtendedCoreMessage[] = []

  for (const message of messages) {
    // Convert annotations to data messages
    if (message.annotations && message.annotations.length > 0) {
      message.annotations.forEach(annotation => {
        result.push({
          role: 'data',
          content: annotation
        })
      })
    }

    // Convert reasoning to data message with unified structure (including time)
    if (message.reasoning) {
      const reasoningTime = (message as any).reasoningTime ?? 0
      const reasoningData =
        typeof message.reasoning === 'string'
          ? { reasoning: message.reasoning, time: reasoningTime }
          : {
              ...(message.reasoning as Record<string, unknown>),
              time:
                (message as any).reasoningTime ??
                (message.reasoning as any).time ??
                0
            }
      result.push({
        role: 'data',
        content: {
          type: 'reasoning',
          data: reasoningData
        } as JSONValue
      })
    }

    // Convert current message while preserving custom properties
    const converted = convertToCoreMessages([message])

    // Preserve custom properties when converting user messages
    if (message.role === 'user') {
      const customProps: any = {}

      // Preserve file contents (new structure)
      if ((message as any).fileContents) {
        customProps.fileContents = (message as any).fileContents
      }

      // Preserve experimental attachments for UI
      if ((message as any).experimental_attachments) {
        customProps.experimental_attachments = (
          message as any
        ).experimental_attachments
      }

      // Preserve supabase files for backward compatibility
      if ((message as any).supabaseFiles) {
        customProps.supabaseFiles = (message as any).supabaseFiles
      }

      // Preserve legacy data if it exists
      if ((message as any).data) {
        customProps.data = (message as any).data
      }

      result.push(
        ...converted.map(coreMsg => ({
          ...coreMsg,
          ...customProps
        }))
      )
    } else {
      result.push(...converted)
    }
  }

  return result
}
