import { NextRequest, NextResponse } from 'next/server'

import { nanoid } from 'nanoid'

import {
  createDefaultFolder,
  createFolder,
  getFolders
} from '@/lib/actions/folders'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { type Folder } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const folders = await getFolders(userId)

    if (folders.length === 0) {
      const defaultFolder = await createDefaultFolder(userId)
      return NextResponse.json([defaultFolder])
    }

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, color, description } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const folder: Omit<Folder, 'createdAt' | 'updatedAt' | 'userId'> = {
      id: nanoid(),
      name: name.trim(),
      color: color || '#6B7280',
      description: description || undefined
    }

    const createdFolder = await createFolder(folder, userId)

    if (!createdFolder) {
      return NextResponse.json(
        { error: 'Failed to create folder' },
        { status: 500 }
      )
    }

    return NextResponse.json(createdFolder, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}
