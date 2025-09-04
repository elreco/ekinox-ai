import {
  convertToCoreMessages,
  CoreMessage,
  createDataStreamResponse,
  DataStreamWriter,
  streamText
} from 'ai'

import { researcher } from '@/lib/agents/researcher'

import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'
import { isReasoningModel } from '../utils/registry'

import { handleStreamFinish } from './handle-stream-finish'
import { BaseStreamConfig } from './types'

// Function to check if a message contains ask_question tool invocation
function containsAskQuestionTool(message: CoreMessage) {
  // For CoreMessage format, we check the content array
  if (message.role !== 'assistant' || !Array.isArray(message.content)) {
    return false
  }

  // Check if any content item is a tool-call with ask_question tool
  return message.content.some(
    item => item.type === 'tool-call' && item.toolName === 'ask_question'
  )
}

export function createToolCallingStreamResponse(config: BaseStreamConfig) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode, userId } = config
      const modelId = `${model.providerId}:${model.id}`

      try {
        // Enhanced file handling - process files from data.fileContents
        const coreMessages = messages.map(msg => {
          // Check if message has file contents in data
          if (
            msg.role === 'user' &&
            (msg.data as any)?.fileContents &&
            Array.isArray((msg.data as any).fileContents)
          ) {
            // Build content with file contents
            let fullContent = msg.content as string

            ;(msg.data as any).fileContents.forEach((file: any) => {
              if (file.isImage) {
                fullContent += `\n\n[Image: ${file.name}]`
              } else {
                fullContent += `\n\n--- File: ${file.name} (${file.type}) ---\n${file.content}\n--- End of ${file.name} ---`
              }
            })

            return {
              role: 'user' as const,
              content: fullContent
            }
          }

          // Fallback: check for experimental_attachments (legacy)
          if (msg.role === 'user' && msg.experimental_attachments) {
            return {
              role: 'user' as const,
              content: [
                { type: 'text' as const, text: msg.content },
                ...msg.experimental_attachments.map(attachment => {
                  if (attachment.contentType?.startsWith('image/')) {
                    return {
                      type: 'image' as const,
                      image: attachment.url
                    }
                  } else {
                    return {
                      type: 'text' as const,
                      text: `File: ${attachment.name} - Content not processed`
                    }
                  }
                })
              ]
            }
          }

          // For other messages, use standard conversion
          return convertToCoreMessages([msg])[0]
        })

        const truncatedMessages = truncateMessages(
          coreMessages,
          getMaxAllowedTokens(model)
        )

        let researcherConfig = await researcher({
          messages: truncatedMessages,
          model: modelId,
          searchMode
        })

        const result = streamText({
          ...researcherConfig,
          onFinish: async result => {
            // Check if the last message contains an ask_question tool invocation
            const shouldSkipRelatedQuestions =
              isReasoningModel(modelId) ||
              (result.response.messages.length > 0 &&
                containsAskQuestionTool(
                  result.response.messages[
                    result.response.messages.length - 1
                  ] as CoreMessage
                ))

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream,
              userId,
              skipRelatedQuestions: shouldSkipRelatedQuestions
            })
          }
        })

        result.mergeIntoDataStream(dataStream)
      } catch (error) {
        console.error('Stream execution error:', error)
        throw error
      }
    },
    onError: error => {
      // console.error('Stream error:', error)
      return error instanceof Error ? error.message : String(error)
    }
  })
}
