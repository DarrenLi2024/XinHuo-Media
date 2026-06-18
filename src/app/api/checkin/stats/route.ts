import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { apiError, requireAuth } from '@/lib/api/security';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id') || '';

    if (isSupabaseConfigured() && eventId) {
      const supabase = createServerClient();
      const { data: guests, error } = await supabase.from('guests')
        .select('*').eq('event_id', eventId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const list = guests || [];
      const total = list.length;
      const checkedIn = list.filter((g) => g.check_in_status === 'checked_in').length;

      return NextResponse.json({
        success: true,
        data: {
          total,
          checkedIn,
          notCheckedIn: total - checkedIn,
          checkInRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
        },
      });
    }

    // Demo fallback
    const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=demo&type=attendees`);
    const json = await res.json();
    const list = json.data || [];
    const total = list.length;
    const checkedIn = list.filter((a: { checkin_status: string }) => a.checkin_status === 'checked_in').length;

    return NextResponse.json({
      success: true,
      data: { total, checkedIn, notCheckedIn: total - checkedIn, checkInRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0 },
    });
  } catch (error) {
    return apiError(error);
  }
}
