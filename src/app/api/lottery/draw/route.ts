import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { apiError, requireAuth, writeAuditLog } from '@/lib/api/security';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const eventId = body.event_id || 'demo';

    // 读取已签到人员作为抽奖池
    let candidates: Array<Record<string, unknown>> = [];

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data: guests } = await supabase.from('guests')
        .select('*').eq('event_id', eventId).eq('check_in_status', 'checked_in');
      candidates = (guests || []).filter((g) => !g.lottery_blacklisted);
    } else {
      const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=${eventId}&type=attendees`);
      const json = await res.json();
      candidates = (json.data || []).filter(
        (a: { checkin_status: string; lottery_eligible: boolean }) =>
          a.checkin_status === 'checked_in' && a.lottery_eligible !== false,
      );
    }

    if (candidates.length === 0) {
      return NextResponse.json({ success: false, error: '暂无可抽奖的签到人员' });
    }

    const drawCount = Math.min(body.draw_count || 1, candidates.length);
    // Fisher-Yates shuffle
    const shuffled = [...candidates];
    const randomValues = new Uint32Array(shuffled.length);
    crypto.getRandomValues(randomValues);
    const indices = Array.from({ length: shuffled.length }, (_, i) => ({ val: randomValues[i], i }));
    indices.sort((a, b) => a.val - b.val);
    const winners = indices.slice(0, drawCount).map((x) => shuffled[x.i]);

    // 写入中奖记录
    if (isSupabaseConfigured() && body.prize_id) {
      const supabase = createServerClient();
      const recordId = crypto.randomUUID();
      await supabase.from('lottery_winners').insert(
        winners.map((w) => ({
          event_id: eventId,
          prize_id: body.prize_id,
          guest_id: w.id,
          record_id: recordId,
          win_time: new Date().toISOString(),
        })),
      );

      // 减少奖品库存
      await supabase.rpc('decrement_prize_remaining', {
        p_prize_id: body.prize_id,
        p_count: drawCount,
      });
    }

    await writeAuditLog(request, user, 'lottery.draw', 'lottery', eventId, { count: drawCount });

    return NextResponse.json({
      success: true,
      data: winners.map((w) => ({
        id: w.id,
        name: w.name,
        phone: (w as Record<string, unknown>).phone,
        company: (w as Record<string, unknown>).company,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
