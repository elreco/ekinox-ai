import { getRedisClient } from '@/lib/redis/config'
import { type Folder } from '@/lib/types'

function getUserFolderKey(userId: string) {
  return `user:${userId}:folders`
}

export async function getFolders(userId?: string | null): Promise<Folder[]> {
  if (!userId) {
    return []
  }

  try {
    const redis = await getRedisClient()
    const folderKeys = await redis.zrange(getUserFolderKey(userId), 0, -1, {
      rev: false
    })

    if (folderKeys.length === 0) {
      return []
    }

    const results = await Promise.all(
      folderKeys.map(async folderKey => {
        const folder = await redis.hgetall(folderKey)
        return folder
      })
    )

    return results
      .filter((result): result is Record<string, any> => {
        if (result === null || Object.keys(result).length === 0) {
          return false
        }
        return true
      })
      .map(folder => {
        const plainFolder = { ...folder }
        if (plainFolder.createdAt && !(plainFolder.createdAt instanceof Date)) {
          plainFolder.createdAt = new Date(plainFolder.createdAt)
        }
        if (plainFolder.updatedAt && !(plainFolder.updatedAt instanceof Date)) {
          plainFolder.updatedAt = new Date(plainFolder.updatedAt)
        }
        return plainFolder as Folder
      })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return []
  }
}

export async function getFolder(
  id: string,
  userId: string
): Promise<Folder | null> {
  try {
    const redis = await getRedisClient()
    const folder = await redis.hgetall<Folder>(`folder:${id}`)

    if (!folder || Object.keys(folder).length === 0) {
      return null
    }

    if (folder.userId !== userId) {
      return null
    }

    if (folder.createdAt && !(folder.createdAt instanceof Date)) {
      folder.createdAt = new Date(folder.createdAt)
    }
    if (folder.updatedAt && !(folder.updatedAt instanceof Date)) {
      folder.updatedAt = new Date(folder.updatedAt)
    }

    return folder
  } catch (error) {
    console.error('Error fetching folder:', error)
    return null
  }
}

export async function createFolder(
  folder: Omit<Folder, 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<Folder | null> {
  try {
    const redis = await getRedisClient()
    const now = new Date()

    const folderToSave: Folder = {
      ...folder,
      createdAt: now,
      updatedAt: now,
      userId
    }

    // Filter out null/undefined values for Redis
    const cleanFolderData = Object.fromEntries(
      Object.entries(folderToSave).filter(([_, value]) => value != null)
    )

    const pipeline = redis.pipeline()
    pipeline.hmset(`folder:${folder.id}`, cleanFolderData)
    pipeline.zadd(
      getUserFolderKey(userId),
      now.getTime(),
      `folder:${folder.id}`
    )

    await pipeline.exec()
    return folderToSave
  } catch (error) {
    console.error('Error creating folder:', error)
    return null
  }
}

export async function updateFolder(
  id: string,
  updates: Partial<Omit<Folder, 'id' | 'userId' | 'createdAt'>>,
  userId: string
): Promise<Folder | null> {
  try {
    const redis = await getRedisClient()
    const existingFolder = await getFolder(id, userId)

    if (!existingFolder) {
      return null
    }

    const updatedFolder: Folder = {
      ...existingFolder,
      ...updates,
      updatedAt: new Date()
    }

    // Filter out null/undefined values for Redis
    const cleanFolderData = Object.fromEntries(
      Object.entries(updatedFolder).filter(([_, value]) => value != null)
    )

    await redis.hmset(`folder:${id}`, cleanFolderData)
    return updatedFolder
  } catch (error) {
    console.error('Error updating folder:', error)
    return null
  }
}

export async function deleteFolder(
  folderId: string,
  userId: string
): Promise<{ error?: string }> {
  try {
    const redis = await getRedisClient()
    const folder = await getFolder(folderId, userId)

    if (!folder) {
      return { error: 'Folder not found' }
    }

    const pipeline = redis.pipeline()
    pipeline.del(`folder:${folderId}`)
    pipeline.zrem(getUserFolderKey(userId), `folder:${folderId}`)

    await pipeline.exec()
    return {}
  } catch (error) {
    console.error('Error deleting folder:', error)
    return { error: 'Failed to delete folder' }
  }
}

export async function getChatsInFolder(folderId: string, userId: string) {
  try {
    const redis = await getRedisClient()
    const userChatKey = `user:${userId}:chats`
    const chatKeys = await redis.zrange(userChatKey, 0, -1, { rev: true })

    if (chatKeys.length === 0) {
      return []
    }

    const results = await Promise.all(
      chatKeys.map(async chatKey => {
        const chat = await redis.hgetall(chatKey)
        return chat
      })
    )

    return results
      .filter((result): result is Record<string, any> => {
        if (result === null || Object.keys(result).length === 0) {
          return false
        }
        return result.folderId === folderId
      })
      .map(chat => {
        const plainChat = { ...chat }
        if (typeof plainChat.messages === 'string') {
          try {
            plainChat.messages = JSON.parse(plainChat.messages)
          } catch (error) {
            plainChat.messages = []
          }
        }
        if (plainChat.createdAt && !(plainChat.createdAt instanceof Date)) {
          plainChat.createdAt = new Date(plainChat.createdAt)
        }
        return plainChat
      })
  } catch (error) {
    console.error('Error fetching chats in folder:', error)
    return []
  }
}

export async function createDefaultFolder(
  userId: string
): Promise<Folder | null> {
  const defaultFolder: Omit<Folder, 'createdAt' | 'updatedAt'> = {
    id: `default-${userId}`,
    name: 'General',
    userId,
    color: '#6B7280'
  }

  return await createFolder(defaultFolder, userId)
}
