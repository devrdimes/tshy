import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

// GET /api/chat-messages — Get all chat messages for a user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const messages = await db.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('Failed to fetch chat messages:', error)
    return NextResponse.json({ success: true, data: [] })
  }
}

// POST /api/chat-messages — Save a chat message
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role, content, context } = body

    if (!role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await db.chatMessage.create({
      data: {
        userId: user.id,
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
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await db.chatMessage.deleteMany({ where: { userId: user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to clear chat messages:', error)
    return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 })
  }
}
