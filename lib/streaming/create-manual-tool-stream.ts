import {
  convertToCoreMessages,
  createDataStreamResponse,
  DataStreamWriter,
  JSONValue,
  streamText
} from 'ai'

import { manualResearcher } from '../agents/manual-researcher'
import { ExtendedCoreMessage } from '../types'
import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'

import { handleStreamFinish } from './handle-stream-finish'
import { executeToolCall } from './tool-execution'
import {
  BaseStreamConfig,
  buildContentWithFiles,
  hasFileContents
} from './types'

export function createManualToolStreamResponse(config: BaseStreamConfig) {
  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const { messages, model, chatId, searchMode, userId } = config
      const modelId = `${model.providerId}:${model.id}`
      let toolCallModelId = model.toolCallModel
        ? `${model.providerId}:${model.toolCallModel}`
        : modelId

      try {
        // Enhanced file handling - process files using type-safe utilities
        const coreMessages = messages.map(msg => {
          // Check if message has file contents using type guard
          if (hasFileContents(msg)) {
            return {
              role: 'user' as const,
              content: buildContentWithFiles(msg)
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

        const { toolCallDataAnnotation, toolCallMessages } =
          await executeToolCall(
            truncatedMessages,
            dataStream,
            toolCallModelId,
            searchMode
          )

        const researcherConfig = manualResearcher({
          messages: [...truncatedMessages, ...toolCallMessages],
          model: modelId,
          isSearchEnabled: searchMode
        })

        // Variables to track the reasoning timing.
        let reasoningStartTime: number | null = null
        let reasoningDuration: number | null = null

        const result = streamText({
          ...researcherConfig,
          onFinish: async result => {
            const annotations: ExtendedCoreMessage[] = [
              ...(toolCallDataAnnotation ? [toolCallDataAnnotation] : []),
              {
                role: 'data',
                content: {
                  type: 'reasoning',
                  data: {
                    time: reasoningDuration ?? 0,
                    reasoning: result.reasoning
                  }
                } as JSONValue
              }
            ]

            await handleStreamFinish({
              responseMessages: result.response.messages,
              originalMessages: messages,
              model: modelId,
              chatId,
              dataStream,
              userId,
              skipRelatedQuestions: true,
              annotations
            })
          },
          onChunk(event) {
            const chunkType = event.chunk?.type

            if (chunkType === 'reasoning') {
              if (reasoningStartTime === null) {
                reasoningStartTime = Date.now()
              }
            } else {
              if (reasoningStartTime !== null) {
                const elapsedTime = Date.now() - reasoningStartTime
                reasoningDuration = elapsedTime
                dataStream.writeMessageAnnotation({
                  type: 'reasoning',
                  data: { time: elapsedTime }
                } as JSONValue)
                reasoningStartTime = null
              }
            }
          }
        })

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true
        })
      } catch (error) {
        console.error('Stream execution error:', error)
      }
    },
    onError: error => {
      console.error('Stream error:', error)
      return error instanceof Error ? error.message : String(error)
    }
  })
}
