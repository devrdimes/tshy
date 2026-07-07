import { NextRequest } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'tashyeed-admin-2024';

/**
 * Validates the admin token from the Authorization header.
 * Returns true if the request has a valid admin token.
 */
export function validateAdminToken(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.substring(7);
    return token === ADMIN_SECRET;
  } catch {
    return false;
  }
}

/**
 * Returns a 401 JSON response for unauthorized admin requests.
 */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ success: false, error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Validates admin token from a plain string (for client-side checks).
 */
export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_SECRET;
}
