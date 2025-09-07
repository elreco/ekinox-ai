import { NextRequest, NextResponse } from 'next/server'

import { moveChatToFolder } from '@/lib/actions/chat'
import { getCurrentUserId } from '@/lib/auth/get-current-user'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { folderId } = await request.json()

    const result = await moveChatToFolder((await params).id, folderId, userId)

    if (result.error) {
      const statusCode =
        result.error === 'Unauthorized'
          ? 403
          : result.error === 'Chat not found'
            ? 404
            : 500
      return NextResponse.json({ error: result.error }, { status: statusCode })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error moving chat to folder:', error)
    return NextResponse.json({ error: 'Failed to move chat' }, { status: 500 })
  }
}
