import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { apiError, requireAuth } from '@/lib/api/security';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    if (isSupabaseConfigured() && eventId) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('lottery_winners')
        .select('*, prizes:lottery_prizes(name, level)')
        .eq('event_id', eventId)
        .order('win_time', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    return apiError(error);
  }
}

// Clear history (admin)
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    if (isSupabaseConfigured() && eventId) {
      const supabase = createServerClient();
      const { error } = await supabase.from('lottery_winners').delete().eq('event_id', eventId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
