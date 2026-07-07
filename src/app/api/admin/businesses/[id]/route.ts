import { NextRequest, NextResponse } from 'next/server';
import { validateAdminToken, unauthorizedResponse } from '@/lib/admin-auth';

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/admin/businesses/[id] — delete a business and all its data
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!validateAdminToken(request)) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    const { supabase } = await import('@/lib/db');
    const client = supabase();

    await client.from('plan_steps').delete().eq('business_id', id);
    await client.from('milestones').delete().eq('business_id', id);
    await client.from('financials').delete().eq('business_id', id);
    await client.from('chat_messages').delete().eq('business_id', id);
    await client.from('tasks').delete().eq('business_id', id);
    await client.from('businesses').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
