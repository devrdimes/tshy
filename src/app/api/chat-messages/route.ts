import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/chat-messages — Get all chat messages for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      // Get first user
      const firstUser = await db.user.findFirst()
      if (!firstUser) return NextResponse.json({ success: true, data: [] })
      const messages = await db.chatMessage.findMany({
        where: { userId: firstUser.id },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json({ success: true, data: messages })
    }

    const messages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('Failed to fetch chat messages:', error)
    return NextResponse.json({ success: true, data: [] })
  }
}

// POST /api/chat-messages — Save a chat message
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, role, content, context } = body

    if (!userId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await db.chatMessage.create({
      data: {
        userId,
        role,
        content,
        context: context || '',
      },
    })

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    console.error('Failed to save chat message:', error)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }
}

// DELETE /api/chat-messages — Clear chat history
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      const firstUser = await db.user.findFirst()
      if (!firstUser) return NextResponse.json({ success: true })
      await db.chatMessage.deleteMany({ where: { userId: firstUser.id } })
      return NextResponse.json({ success: true })
    }

    await db.chatMessage.deleteMany({ where: { userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to clear chat messages:', error)
    return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 })
  }
}
