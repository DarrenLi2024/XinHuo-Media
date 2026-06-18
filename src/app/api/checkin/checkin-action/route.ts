import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { apiError, requireAuth } from '@/lib/api/security';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { guestId, event_id } = body;

    if (!guestId) return NextResponse.json({ success: false, error: '请提供嘉宾ID' }, { status: 400 });

    if (isSupabaseConfigured() && event_id) {
      const supabase = createServerClient();

      // 检查是否已签到
      const { data: existing } = await supabase.from('guests')
        .select('id, check_in_status').eq('id', guestId).single();

      if (!existing) return NextResponse.json({ success: false, error: '未找到该嘉宾' }, { status: 404 });
      if (existing.check_in_status === 'checked_in') {
        return NextResponse.json({ success: false, error: '该嘉宾已签到' }, { status: 409 });
      }

      const { error } = await supabase.from('guests').update({
        check_in_status: 'checked_in',
        check_in_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', guestId);

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

      return NextResponse.json({
        success: true,
        data: { id: guestId, check_in_time: new Date().toISOString(), operator: user.name },
      });
    }

    // Demo fallback: call roster
    const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=demo&type=attendees`);
    const json = await res.json();
    const found = (json.data || []).find((a: { id: string }) => a.id === guestId);
    if (!found) return NextResponse.json({ success: false, error: '未找到该嘉宾' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id: guestId, check_in_time: new Date().toISOString() } });
  } catch (error) {
    return apiError(error);
  }
}
