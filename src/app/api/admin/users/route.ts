import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, unauthorizedResponse } from '@/lib/admin-auth';

// GET /api/admin/users — list all users
export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) return unauthorizedResponse();

  try {
    const { supabase } = await import('@/lib/db');
    const client = supabase();

    const { data: users, error } = await client
      .from('users')
      .select('id, name, email, company, role, onboarded, avatar, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get business counts per user
    const { data: bizCounts } = await client
      .from('businesses')
      .select('user_id');

    const countMap: Record<string, number> = {};
    for (const b of bizCounts || []) {
      countMap[b.user_id] = (countMap[b.user_id] || 0) + 1;
    }

    const enriched = (users || []).map((u: any) => ({
      ...u,
      businessCount: countMap[u.id] || 0,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
