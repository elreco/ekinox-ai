'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { FolderOpen, MoreHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Chat } from '@/lib/types'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar'

import { FolderSelector } from '@/components/folders/folder-selector'
import { Spinner } from '../ui/spinner'

interface ChatMenuItemProps {
  chat: Chat
}

const formatDateWithTime = (date: Date | string) => {
  const parsedDate = new Date(date)
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear()
  ) {
    return `Today, ${formatTime(parsedDate)}`
  } else if (
    parsedDate.getDate() === yesterday.getDate() &&
    parsedDate.getMonth() === yesterday.getMonth() &&
    parsedDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday, ${formatTime(parsedDate)}`
  } else {
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

export function ChatMenuItem({ chat }: ChatMenuItemProps) {
  const pathname = usePathname()
  const isActive = pathname === chat.path
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showFolderSelector, setShowFolderSelector] = useState(false)

  const onDelete = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/chat/${chat.id}`, { method: 'DELETE' })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to delete chat')
        }

        toast.success('Chat deleted')
        setIsMenuOpen(false) // Close menu on success
        setDialogOpen(false) // Close dialog on success

        // If deleting the currently active chat, navigate home
        if (isActive) {
          router.push('/')
        }
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } catch (error) {
        console.error('Failed to delete chat:', error)
        toast.error((error as Error).message || 'Failed to delete chat')
        setIsMenuOpen(false) // Close menu on error
        setDialogOpen(false) // Close dialog on error
      }
    })
  }

  const onMoveToFolder = (folderId: string | null) => {
    // Close modal immediately
    setIsMenuOpen(false)
    setShowFolderSelector(false)

    // Start transition which will show the spinner via isPending
    startTransition(async () => {
      try {
        const res = await fetch(`/api/chat/${chat.id}/move`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ folderId })
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to move chat')
        }

        // Only update once after successful API call
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
        toast.success('Chat moved successfully')

      } catch (error) {
        console.error('Failed to move chat:', error)
        toast.error((error as Error).message || 'Failed to move chat')
      }
    })
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <SidebarMenuItem onDragStart={handleDragStart}>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="h-auto flex-col gap-0.5 items-start p-2 pr-8"
      >
        <Link href={chat.path} draggable={false}>
          <div className="text-xs font-medium truncate select-none w-full">
            {chat.title}
          </div>
          <div className="text-xs text-muted-foreground w-full">
            {formatDateWithTime(chat.createdAt)}
          </div>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction disabled={isPending} className="size-7 p-1 mr-1">
            {isPending ? (
              <div className="flex items-center justify-center size-full">
                <Spinner />
              </div>
            ) : (
              <MoreHorizontal size={16} />
            )}
            <span className="sr-only">Chat Actions</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            disabled={isPending}
            className="gap-2"
            onSelect={e => {
              e.preventDefault()
              setShowFolderSelector(true)
            }}
          >
            <FolderOpen size={14} />
            Move to Folder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                disabled={isPending}
                className="gap-2 text-destructive focus:text-destructive"
                onSelect={e => {
                  e.preventDefault()
                  // Don't call onDelete directly, just open the dialog
                }}
              >
                <Trash2 size={14} />
                Delete Chat
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this chat history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isPending}
                  onClick={onDelete} // Call onDelete here
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? (
                    <div className="flex items-center justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={showFolderSelector}
        onOpenChange={setShowFolderSelector}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move Chat to Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Select a folder to move "{chat.title}" to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <FolderSelector
              value={chat.folderId}
              onValueChange={onMoveToFolder}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  )
}
