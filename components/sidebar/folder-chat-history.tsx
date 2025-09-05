'use client'

import { ChevronDown, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { CreateFolderModal } from '@/components/folders/create-folder-modal'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu
} from '@/components/ui/sidebar'
import { type Chat, type Folder } from '@/lib/types'
import { ChatHistorySkeleton } from './chat-history-skeleton'
import { ChatMenuItem } from './chat-menu-item'
import { ClearHistoryAction } from './clear-history-action'

interface FolderWithChats extends Folder {
  chats: Chat[]
}

interface ChatPageResponse {
  chats: Chat[]
  nextOffset: number | null
}

export function FolderChatHistory() {
  const [folders, setFolders] = useState<FolderWithChats[]>([])
  const [uncategorizedChats, setUncategorizedChats] = useState<Chat[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['uncategorized'])
  )
  const [lastUpdateTime, setLastUpdateTime] = useState(0)

  const fetchFoldersAndChats = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true)
    }

    try {
      // Fetch all data in parallel for better performance
      const [foldersResponse, uncategorizedResponse] = await Promise.all([
        fetch('/api/folders'),
        fetch('/api/chats?folderId=null&limit=50')
      ])

      if (!foldersResponse.ok || !uncategorizedResponse.ok) {
        throw new Error('Failed to fetch folders or chats')
      }

      const [foldersData, uncategorizedData] = await Promise.all([
        foldersResponse.json() as Promise<Folder[]>,
        uncategorizedResponse.json() as Promise<ChatPageResponse>
      ])

      // Fetch chats for all folders in parallel
      const folderChatPromises = foldersData.map(async folder => {
        try {
          const chatsResponse = await fetch(
            `/api/chats?folderId=${folder.id}&limit=50`
          )
          const chatsData: ChatPageResponse = chatsResponse.ok
            ? await chatsResponse.json()
            : { chats: [], nextOffset: null }

          return {
            ...folder,
            chats: chatsData.chats
          }
        } catch (error) {
          console.error(`Error fetching chats for folder ${folder.id}:`, error)
          return {
            ...folder,
            chats: []
          }
        }
      })

      const foldersWithChats = await Promise.all(folderChatPromises)

      // Update state immediately
      setFolders(foldersWithChats)
      setUncategorizedChats(uncategorizedData.chats)
    } catch (error) {
      console.error('Failed to load folders and chats:', error)
      if (isInitial) {
        toast.error('Failed to load chat history.')
      }
    } finally {
      if (isInitial) {
        setIsInitialLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchFoldersAndChats(true)
  }, [fetchFoldersAndChats])

  useEffect(() => {
    const handleHistoryUpdate = () => {
      const now = Date.now()
      // Debounce: only update if it's been more than 100ms since last update
      if (now - lastUpdateTime > 100) {
        setLastUpdateTime(now)
        startTransition(async () => {
          await fetchFoldersAndChats(false)
        })
      }
    }
    window.addEventListener('chat-history-updated', handleHistoryUpdate)
    return () => {
      window.removeEventListener('chat-history-updated', handleHistoryUpdate)
    }
  }, [fetchFoldersAndChats, lastUpdateTime])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const onFolderCreated = async () => {
    return new Promise<void>(resolve => {
      startTransition(async () => {
        await fetchFoldersAndChats(false)
        resolve()
      })
    })
  }

  const totalChats =
    folders.reduce((acc, folder) => acc + folder.chats.length, 0) +
    uncategorizedChats.length
  const isHistoryEmpty = !isInitialLoading && totalChats === 0

  if (isInitialLoading) {
    return (
      <div className="flex flex-col flex-1 h-full">
        <SidebarGroup>
          <div className="flex items-center justify-between w-full">
            <SidebarGroupLabel className="p-0">History</SidebarGroupLabel>
          </div>
        </SidebarGroup>
        <div className="flex-1 overflow-y-auto mb-2 relative">
          <div className="py-2">
            <ChatHistorySkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      <SidebarGroup>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <SidebarGroupLabel className="p-0">History</SidebarGroupLabel>
            {isPending && (
              <RefreshCw
                size={12}
                className="animate-spin text-muted-foreground"
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            <CreateFolderModal onFolderCreated={onFolderCreated}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus size={16} />
                <span className="sr-only">Create folder</span>
              </Button>
            </CreateFolderModal>
            <ClearHistoryAction empty={isHistoryEmpty} />
          </div>
        </div>
      </SidebarGroup>

      <div className="flex-1 overflow-y-auto mb-2 relative">
        {isHistoryEmpty ? (
          <div className="px-2 text-foreground/30 text-sm text-center py-4">
            No search history
          </div>
        ) : (
          <div className="space-y-1">
            {uncategorizedChats.length > 0 && (
              <Collapsible
                open={expandedFolders.has('uncategorized')}
                onOpenChange={() => toggleFolder('uncategorized')}
              >
                <CollapsibleTrigger
                  className="flex items-center gap-2 w-full p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  draggable={false}
                >
                  {expandedFolders.has('uncategorized') ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
                    <span>Uncategorized</span>
                    <span className="text-xs">
                      ({uncategorizedChats.length})
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu>
                    {uncategorizedChats.map((chat: Chat) => (
                      <ChatMenuItem key={chat.id} chat={chat} />
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            )}

            {folders.map(folder => (
              <Collapsible
                key={folder.id}
                open={expandedFolders.has(folder.id)}
                onOpenChange={() => toggleFolder(folder.id)}
              >
                <CollapsibleTrigger
                  className="flex items-center gap-2 w-full p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  draggable={false}
                >
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: folder.color || '#6B7280' }}
                    />
                    <span>{folder.name}</span>
                    <span className="text-xs">({folder.chats.length})</span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {folder.chats.length > 0 ? (
                    <SidebarMenu>
                      {folder.chats.map((chat: Chat) => (
                        <ChatMenuItem key={chat.id} chat={chat} />
                      ))}
                    </SidebarMenu>
                  ) : (
                    <div className="px-4 py-2 text-xs text-muted-foreground">
                      No conversations yet
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
