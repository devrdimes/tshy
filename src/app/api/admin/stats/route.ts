import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, unauthorizedResponse } from '@/lib/admin-auth';
import { db } from '@/lib/db';

// GET /api/admin/stats — platform-wide statistics
export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) return unauthorizedResponse();

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const supabaseClient = (await import('@/lib/db')).supabase();

    // Parallel queries for efficiency
    const [
      { count: totalUsers },
      { count: totalBusinesses },
      { count: totalPlanSteps },
      { count: activeSessions },
      { count: newUsersToday },
      { count: newBusinessesToday },
      { data: rawUsers },
      { data: rawBusinesses },
      { data: rawPitchDecks },
    ] = await Promise.all([
      supabaseClient.from('users').select('*', { count: 'exact', head: true }),
      supabaseClient.from('businesses').select('*', { count: 'exact', head: true }),
      supabaseClient.from('plan_steps').select('*', { count: 'exact', head: true }),
      supabaseClient.from('sessions').select('*', { count: 'exact', head: true }).gt('expires_at', now.toISOString()),
      supabaseClient.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabaseClient.from('businesses').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      // Last 14 days signups per day
      supabaseClient.from('users').select('created_at').gte('created_at', last14Days).order('created_at', { ascending: true }),
      // Last 14 days businesses per day
      supabaseClient.from('businesses').select('created_at, industry').gte('created_at', last14Days).order('created_at', { ascending: true }),
      // Pitch decks generated (non-null, non-empty)
      supabaseClient.from('businesses').select('id').neq('pitch_deck', null).neq('pitch_deck', '').neq('pitch_deck', '[]'),
    ]);

    // Aggregate signups per day
    const signupsPerDay: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      signupsPerDay[key] = 0;
    }
    for (const u of rawUsers || []) {
      const key = u.created_at?.split('T')[0];
      if (key && key in signupsPerDay) signupsPerDay[key]++;
    }

    // Aggregate businesses per day
    const bizPerDay: Record<string, number> = {};
    for (const k of Object.keys(signupsPerDay)) bizPerDay[k] = 0;
    for (const b of rawBusinesses || []) {
      const key = b.created_at?.split('T')[0];
      if (key && key in bizPerDay) bizPerDay[key]++;
    }

    // Industry breakdown
    const industryMap: Record<string, number> = {};
    for (const b of rawBusinesses || []) {
      const ind = b.industry || 'Other';
      industryMap[ind] = (industryMap[ind] || 0) + 1;
    }
    const industryBreakdown = Object.entries(industryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalBusinesses: totalBusinesses || 0,
        totalPlanSteps: totalPlanSteps || 0,
        activeSessions: activeSessions || 0,
        newUsersToday: newUsersToday || 0,
        newBusinessesToday: newBusinessesToday || 0,
        pitchDecksGenerated: rawPitchDecks?.length || 0,
        signupsPerDay: Object.entries(signupsPerDay).map(([date, count]) => ({ date, count })),
        bizPerDay: Object.entries(bizPerDay).map(([date, count]) => ({ date, count })),
        industryBreakdown,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN STATS]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
