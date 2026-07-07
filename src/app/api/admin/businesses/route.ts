import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, unauthorizedResponse } from '@/lib/admin-auth';

// GET /api/admin/businesses — list all businesses across all users
export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) return unauthorizedResponse();

  try {
    const { supabase } = await import('@/lib/db');
    const client = supabase();

    const { data: businesses, error } = await client
      .from('businesses')
      .select('id, name, description, industry, stage, user_id, current_step, total_steps, completed, created_at, pitch_deck')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get plan step counts per business
    const { data: stepCounts } = await client
      .from('plan_steps')
      .select('business_id, status');

    const stepMap: Record<string, { total: number; completed: number }> = {};
    for (const s of stepCounts || []) {
      if (!stepMap[s.business_id]) stepMap[s.business_id] = { total: 0, completed: 0 };
      stepMap[s.business_id].total++;
      if (s.status === 'completed') stepMap[s.business_id].completed++;
    }

    // Get user info for each business
    const userIds = [...new Set((businesses || []).map((b: any) => b.user_id))];
    const { data: users } = await client
      .from('users')
      .select('id, name, email, avatar')
      .in('id', userIds);

    const userMap: Record<string, any> = {};
    for (const u of users || []) userMap[u.id] = u;

    const enriched = (businesses || []).map((b: any) => ({
      ...b,
      user: userMap[b.user_id] || null,
      planSteps: stepMap[b.id] || { total: 0, completed: 0 },
      hasPitchDeck: !!b.pitch_deck && b.pitch_deck !== '[]' && b.pitch_deck !== '',
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
