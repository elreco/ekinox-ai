'use client'

import { useEffect, useState } from 'react'

import { Check, Folder } from 'lucide-react'

import { type Folder as FolderType } from '@/lib/types'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface FolderSelectorProps {
  value?: string | null
  onValueChange: (folderId: string | null) => void | Promise<void>
  placeholder?: string
  disabled?: boolean
}

export function FolderSelector({
  value,
  onValueChange,
  placeholder = 'Select folder',
  disabled = false
}: FolderSelectorProps) {
  const [folders, setFolders] = useState<FolderType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch('/api/folders')
        if (response.ok) {
          const foldersData = await response.json()
          setFolders(foldersData)
        }
      } catch (error) {
        console.error('Error fetching folders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFolders()
  }, [])

  const handleValueChange = (newValue: string) => {
    const folderId = newValue === 'uncategorized' ? null : newValue
    onValueChange(folderId)
  }

  const getDisplayValue = () => {
    if (!value) {
      return 'Uncategorized'
    }
    const folder = folders.find(f => f.id === value)
    return folder?.name || 'Unknown folder'
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Loading folders..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select
      value={value || 'uncategorized'}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-muted-foreground" />
            <span>{getDisplayValue()}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="uncategorized">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#9CA3AF' }}
            />
            <span>Uncategorized</span>
            {!value && <Check size={16} className="ml-auto" />}
          </div>
        </SelectItem>
        {folders.map(folder => (
          <SelectItem key={folder.id} value={folder.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: folder.color || '#6B7280' }}
              />
              <span>{folder.name}</span>
              {value === folder.id && <Check size={16} className="ml-auto" />}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
