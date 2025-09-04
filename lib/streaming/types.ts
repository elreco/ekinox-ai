import { Message } from 'ai'

import { Model } from '../types/models'

export interface FileContent {
  name: string
  type: string
  content: string
  isImage: boolean
}

export interface MessageWithFiles extends Message {
  fileContents?: FileContent[]
}

export interface BaseStreamConfig {
  messages: Message[]
  model: Model
  chatId: string
  searchMode: boolean
  userId: string
}

// Type guards and utilities
export function hasFileContents(message: Message): message is MessageWithFiles {
  return (
    message.role === 'user' &&
    'fileContents' in message &&
    Array.isArray((message as any).fileContents)
  )
}

export function getFileContents(message: Message): FileContent[] {
  if (hasFileContents(message)) {
    return (message as any).fileContents || []
  }
  return []
}

export function getMessageContent(message: Message): string {
  return typeof message.content === 'string' ? message.content : ''
}

export function buildContentWithFiles(message: Message): string {
  let fullContent = getMessageContent(message)
  const fileContents = getFileContents(message)

  fileContents.forEach(file => {
    if (file.isImage) {
      fullContent += `\n\n[Image: ${file.name}]`
    } else {
      fullContent += `\n\n--- File: ${file.name} (${file.type}) ---\n${file.content}\n--- End of ${file.name} ---`
    }
  })

  return fullContent
}
