import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

// 抽奖执行 — 从 roster 构建抽奖池并执行抽奖
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const eventId = body.event_id || 'demo';

    // 读取已签到人员作为抽奖池
    const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=${eventId}&type=attendees`);
    const json = await res.json();
    if (!json.success) return NextResponse.json({ success: false, error: '加载参与者失败' });

    const candidates = (json.data || [])
      .filter((a: { checkin_status: string; lottery_eligible: boolean }) =>
        a.checkin_status === 'checked_in' && a.lottery_eligible !== false
      );

    if (candidates.length === 0) {
      return NextResponse.json({ success: false, error: '暂无可抽奖的签到人员' });
    }

    const drawCount = Math.min(body.draw_count || 1, candidates.length);
    // Use crypto.getRandomValues for fair shuffling
    const shuffled = [...candidates];
    const randomValues = new Uint32Array(shuffled.length);
    crypto.getRandomValues(randomValues);
    const indices = Array.from({ length: shuffled.length }, (_, i) => ({ val: randomValues[i], i }));
    indices.sort((a, b) => a.val - b.val);
    const winners = indices.slice(0, drawCount).map(({ i }) => shuffled[i]);

    return NextResponse.json({
      success: true,
      data: {
        winners: winners.map((w: { id: string; name: string; company?: string }) => ({
          id: w.id, name: w.name, company: w.company,
        })),
        total_candidates: candidates.length,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
