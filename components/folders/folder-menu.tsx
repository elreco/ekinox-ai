'use client'

import { useState, useTransition } from 'react'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'

interface FolderMenuProps {
  folderId: string
  folderName: string
  chatCount: number
  onFolderUpdated?: () => void
}

export function FolderMenu({
  folderId,
  folderName,
  chatCount,
  onFolderUpdated
}: FolderMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveChatsDialog, setShowMoveChatsDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/folders/${folderId}`, {
          method: 'DELETE'
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to delete folder')
        }

        toast.success(`Folder "${folderName}" deleted successfully`)
        setIsMenuOpen(false)
        setShowDeleteDialog(false)

        if (onFolderUpdated) {
          await onFolderUpdated()
        }
      } catch (error) {
        console.error('Failed to delete folder:', error)
        toast.error((error as Error).message || 'Failed to delete folder')
        setIsMenuOpen(false)
        setShowDeleteDialog(false)
      }
    })
  }

  const handleMoveChatsAndDelete = () => {
    startTransition(async () => {
      try {
        // First, get all chats in this folder
        const chatsResponse = await fetch(
          `/api/chats?folderId=${folderId}&limit=200`
        )
        if (!chatsResponse.ok) {
          throw new Error('Failed to fetch chats')
        }

        const { chats } = await chatsResponse.json()

        // Move all chats to uncategorized (folderId = null)
        const movePromises = chats.map((chat: any) =>
          fetch(`/api/chat/${chat.id}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderId: null })
          })
        )

        await Promise.all(movePromises)

        // Now delete the folder
        const deleteRes = await fetch(`/api/folders/${folderId}`, {
          method: 'DELETE'
        })

        if (!deleteRes.ok) {
          const errorData = await deleteRes.json()
          throw new Error(errorData.error || 'Failed to delete folder')
        }

        toast.success(
          `Folder "${folderName}" deleted and ${chatCount} chat${chatCount > 1 ? 's' : ''} moved to Uncategorized`
        )
        setIsMenuOpen(false)
        setShowMoveChatsDialog(false)

        if (onFolderUpdated) {
          await onFolderUpdated()
        }
      } catch (error) {
        console.error('Failed to move chats and delete folder:', error)
        toast.error((error as Error).message || 'Failed to delete folder')
        setIsMenuOpen(false)
        setShowMoveChatsDialog(false)
      }
    })
  }

  const canDelete = chatCount === 0

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={isPending}
          onClick={e => e.stopPropagation()}
        >
          {isPending ? <Spinner /> : <MoreHorizontal size={12} />}
          <span className="sr-only">Folder actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        <DropdownMenuItem disabled={true} className="gap-2">
          <Edit size={14} />
          Edit Folder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              disabled={isPending}
              className="gap-2 text-destructive focus:text-destructive"
              onSelect={e => {
                e.preventDefault()
                if (canDelete) {
                  setShowDeleteDialog(true)
                } else {
                  setShowMoveChatsDialog(true)
                }
              }}
            >
              <Trash2 size={14} />
              Delete Folder
              {!canDelete && (
                <span className="text-xs ml-1 text-muted-foreground">
                  ({chatCount} chat{chatCount > 1 ? 's' : ''})
                </span>
              )}
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Are you sure you want to delete the folder &quot;{folderName}&quot;?
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This will only delete the folder
                  itself. No chats will be deleted - they are safely stored and
                  can be accessed from other folders or the uncategorized
                  section.
                </p>
                <p className="text-sm font-medium">
                  This action cannot be undone.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner />
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog for folders with chats */}
        <AlertDialog
          open={showMoveChatsDialog}
          onOpenChange={setShowMoveChatsDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder with Chats</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  The folder &quot;{folderName}&quot; contains {chatCount} chat
                  {chatCount > 1 ? 's' : ''}.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>What happens:</strong>
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>
                    All {chatCount} chat{chatCount > 1 ? 's' : ''} will be moved
                    to &quot;Uncategorized&quot;
                  </li>
                  <li>The folder &quot;{folderName}&quot; will be permanently deleted</li>
                  <li>Your chats will remain safe and accessible</li>
                </ul>
                <p className="text-sm font-medium text-destructive">
                  This action cannot be undone.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={handleMoveChatsAndDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner />
                    Moving & Deleting...
                  </div>
                ) : (
                  `Move ${chatCount} Chat${chatCount > 1 ? 's' : ''} & Delete Folder`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
