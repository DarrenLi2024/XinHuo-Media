import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { unlinkDemoEventCustomer } from '@/lib/demo-store';
import { apiError, requireAuth, requireEventAccess, writeAuditLog } from '@/lib/api/security';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    const { id, linkId } = await params;
    const user = await requireAuth(request);
    await requireEventAccess(user, id, 'manager');

    if (!isSupabaseConfigured()) {
      const deleted = unlinkDemoEventCustomer(id, linkId);
      if (!deleted) return NextResponse.json({ error: '活动客户关系不存在' }, { status: 404 });
      await writeAuditLog(request, user, 'event-customer.unlink', 'event_customer', linkId);
      return NextResponse.json({ success: true });
    }

    const { error } = await createServerClient()
      .from('event_customers')
      .delete()
      .eq('event_id', id)
      .eq('id', linkId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog(request, user, 'event-customer.unlink', 'event_customer', linkId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
