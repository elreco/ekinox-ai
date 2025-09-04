import { NextRequest, NextResponse } from 'next/server'

import { getChatsPage, saveChat } from '@/lib/actions/chat'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { type Chat } from '@/lib/types'

interface ChatPageResponse {
  chats: Chat[]
  nextOffset: number | null
}

export async function GET(request: NextRequest) {
  const enableSaveChatHistory = process.env.ENABLE_SAVE_CHAT_HISTORY === 'true'
  if (!enableSaveChatHistory) {
    return NextResponse.json<ChatPageResponse>({ chats: [], nextOffset: null })
  }

  const { searchParams } = new URL(request.url)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const userId = await getCurrentUserId()

  try {
    const result = await getChatsPage(userId, limit, offset)
    return NextResponse.json<ChatPageResponse>(result)
  } catch (error) {
    console.error('API route error fetching chats:', error)
    return NextResponse.json<ChatPageResponse>(
      { chats: [], nextOffset: null },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const enableSaveChatHistory = process.env.ENABLE_SAVE_CHAT_HISTORY === 'true'
  if (!enableSaveChatHistory) {
    return NextResponse.json(
      { error: 'Chat history saving is disabled.' },
      { status: 403 }
    )
  }

  try {
    const { id, messages, title } = await request.json()
    const userId = (await getCurrentUserId()) || 'anonymous'

    await saveChat(
      {
        id,
        messages,
        createdAt: new Date(),
        userId,
        path: `/search/${id}`,
        title
      },
      userId
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API route error saving chat:', error)
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 })
  }
}
