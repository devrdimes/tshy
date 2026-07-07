import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, unauthorizedResponse } from '@/lib/admin-auth';

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/admin/users/[id] — delete a user and all their data
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!validateAdminToken(request)) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    const { supabase } = await import('@/lib/db');
    const client = supabase();

    // Delete all user data in order (FK constraints)
    const { data: userBusinesses } = await client.from('businesses').select('id').eq('user_id', id);
    const bizIds = (userBusinesses || []).map((b: any) => b.id);

    if (bizIds.length > 0) {
      await client.from('plan_steps').delete().in('business_id', bizIds);
      await client.from('milestones').delete().in('business_id', bizIds);
      await client.from('financials').delete().in('business_id', bizIds);
      await client.from('chat_messages').delete().in('business_id', bizIds);
      await client.from('tasks').delete().in('business_id', bizIds);
      await client.from('businesses').delete().in('id', bizIds);
    }

    await client.from('sessions').delete().eq('user_id', id);
    await client.from('notifications').delete().eq('user_id', id);
    await client.from('tasks').delete().eq('user_id', id);
    await client.from('users').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] — update user role/status
export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!validateAdminToken(request)) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { supabase } = await import('@/lib/db');
    const client = supabase();

    const { data, error } = await client
      .from('users')
      .update({ role: body.role })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
