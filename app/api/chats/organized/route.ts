import { NextRequest, NextResponse } from 'next/server'

import { getChatsPage } from '@/lib/actions/chat'
import { getFolders } from '@/lib/actions/folders'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { type Chat } from '@/lib/types'

interface OrganizedChatsResponse {
  folders: Array<{
    id: string
    name: string
    color?: string
    chats: Chat[]
  }>
  uncategorizedChats: Chat[]
}

export async function GET(request: NextRequest) {
  const enableSaveChatHistory = process.env.ENABLE_SAVE_CHAT_HISTORY === 'true'
  if (!enableSaveChatHistory) {
    return NextResponse.json<OrganizedChatsResponse>({
      folders: [],
      uncategorizedChats: []
    })
  }

  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all data in parallel
    const [folders, allChatsResult] = await Promise.all([
      getFolders(userId),
      getChatsPage(userId, 200, 0) // Get more chats in one go
    ])

    const allChats = allChatsResult.chats

    // Organize chats by folder
    const uncategorizedChats = allChats.filter(
      chat => !chat.folderId || chat.folderId === ''
    )

    const foldersWithChats = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      chats: allChats.filter(chat => chat.folderId === folder.id)
    }))

    const response: OrganizedChatsResponse = {
      folders: foldersWithChats,
      uncategorizedChats
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('API route error fetching organized chats:', error)
    return NextResponse.json<OrganizedChatsResponse>(
      { folders: [], uncategorizedChats: [] },
      { status: 500 }
    )
  }
}
