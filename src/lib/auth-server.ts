import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

/**
 * Extracts the user from the Authorization header of a NextRequest.
 * Returns null if the user is not found, token is invalid, or session expired.
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) {
      return null;
    }

    const session = await db.session.findUnique({
      where: { token },
    });

    if (!session) {
      return null;
    }

    if (new Date() > new Date(session.expiresAt)) {
      try {
        await db.session.delete({ where: { id: session.id } });
      } catch {
        // ignore
      }
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    return user;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}
