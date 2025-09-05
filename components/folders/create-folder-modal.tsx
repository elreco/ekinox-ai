'use client'

import { Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

interface CreateFolderModalProps {
  onFolderCreated?: () => void
  children?: React.ReactNode
}

const FOLDER_COLORS = [
  { name: 'Gray', value: '#6B7280' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' }
]

export function CreateFolderModal({
  onFolderCreated,
  children
}: CreateFolderModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value)
  const [isPending, startTransition] = useTransition()
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Folder name is required')
      return
    }

    setIsCreating(true)

    startTransition(async () => {
      try {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            color: selectedColor
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create folder')
        }

        const folder = await response.json()

        // Close modal immediately for better UX
        setName('')
        setDescription('')
        setSelectedColor(FOLDER_COLORS[0].value)
        setOpen(false)

        // Trigger folder update
        if (onFolderCreated) {
          await onFolderCreated()
        }

        toast.success(`Folder "${folder.name}" created successfully`)
      } catch (error) {
        console.error('Error creating folder:', error)
        toast.error((error as Error).message || 'Failed to create folder')
      } finally {
        setIsCreating(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus size={16} />
            <span className="sr-only">Create folder</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your conversations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter folder name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter folder description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isCreating}
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-foreground scale-110'
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  disabled={isCreating}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <Spinner />
                Creating...
              </div>
            ) : (
              'Create Folder'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
